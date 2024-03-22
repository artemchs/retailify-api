import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CreateOrderDto } from './dto/create-order.dto'
import { UpdateOrderDto } from './dto/update-order.dto'
import { DbService } from '../../db/db.service'
import getDiscountedPrice from '../common/utils/getDiscountedPrice'
import { Prisma, PrismaClient } from '@prisma/client'
import { DefaultArgs } from '@prisma/client/runtime/library'
import { FindAllOrderDto } from './dto/findAll-order.dto'
import {
  buildContainsArray,
  buildOrderByArray,
  calculateTotalPages,
  getPaginationData,
} from '../common/utils/db-helpers'

type PrismaTx = Omit<
  PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

@Injectable()
export class OrdersService {
  constructor(private db: DbService) {}

  private async getCustomer(id?: string) {
    if (id) {
      const customer = await this.db.customer.findUnique({
        where: {
          id,
        },
      })

      if (!customer) {
        throw new NotFoundException('Клиент не найден.')
      }

      return customer
    }
  }

  private async getShift(id?: string) {
    if (id) {
      const shift = await this.db.cashierShift.findUnique({
        where: {
          id,
        },
        include: {
          pointOfSale: true,
        },
      })

      if (!shift) {
        throw new NotFoundException('Смена не найдена.')
      }

      return shift
    }
  }

  private async getOrder(id?: string) {
    if (id) {
      const order = await this.db.order.findUnique({
        where: {
          id,
        },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          invoice: {
            select: {
              paymentMethod: true,
            },
          },
          shift: {
            select: {
              cashier: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
              pointOfSale: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      })

      if (!order) {
        throw new NotFoundException('Заказ не найден.')
      }

      return order
    }
  }

  private async caluclateOrder(
    {
      customBulkDiscountFixedAmount,
      customBulkDiscountPercentage,
      customBulkDiscountType,
      items,
      paymentMethod,
      totalCardAmount,
      totalCashAmount,
    }: UpdateOrderDto,
    warehouseId: string,
  ) {
    if (items && items.length >= 1) {
      let totalDiscoutOfAllItems = 0
      let totalWithoutBulkDiscount = 0
      const orderItems: {
        vtwId: string
        quantity: number
        customDiscount?: number
      }[] = []

      await this.db.$transaction(
        async (tx) =>
          await Promise.all(
            items?.map(
              async ({
                id,
                customSaleFixedAmount,
                customSalePercentage,
                quantity,
                customSaleType,
              }) => {
                const variant = await tx.variant.findUnique({
                  where: {
                    id,
                  },
                  select: {
                    sale: true,
                    price: true,
                    id: true,
                  },
                })

                if (variant) {
                  const vtw = await tx.variantToWarehouse.findFirst({
                    where: {
                      variantId: variant.id,
                      warehouseId,
                    },
                  })

                  if (vtw && vtw.id) {
                    const priceWithSale =
                      Number(variant.price) -
                      (variant.sale ? Number(variant.sale) : 0)

                    let customDiscount: number | undefined

                    const priceWithCustomSale = customSaleType
                      ? getDiscountedPrice(
                          customSaleType,
                          priceWithSale,
                          customSaleType === 'FIXED-AMOUNT'
                            ? customSaleFixedAmount
                            : customSalePercentage,
                        )
                      : undefined

                    if (priceWithCustomSale) {
                      totalDiscoutOfAllItems +=
                        priceWithSale - priceWithCustomSale

                      customDiscount = priceWithSale - priceWithCustomSale
                    }

                    totalWithoutBulkDiscount =
                      (priceWithCustomSale ?? priceWithSale) * quantity

                    orderItems.push({
                      quantity,
                      vtwId: vtw.id,
                      customDiscount,
                    })
                  }
                }
              },
            ),
          ),
      )

      const totalWithBulkDiscount = customBulkDiscountType
        ? getDiscountedPrice(
            customBulkDiscountType,
            totalWithoutBulkDiscount,
            customBulkDiscountType === 'FIXED-AMOUNT'
              ? customBulkDiscountFixedAmount
              : customBulkDiscountPercentage,
          )
        : undefined

      if (
        paymentMethod === 'MIXED' &&
        (totalCardAmount ? totalCardAmount : 0) +
          (totalCashAmount ? totalCashAmount : 0) ===
          (totalWithBulkDiscount ?? totalWithoutBulkDiscount)
      ) {
        return {
          items: orderItems,
          totalDiscoutOfAllItems,
          total: totalWithBulkDiscount ?? totalWithoutBulkDiscount,
          cashTotal: totalCashAmount,
          cardTotal: totalCardAmount,
          customBulkDiscount: totalWithBulkDiscount
            ? totalWithoutBulkDiscount - totalWithBulkDiscount
            : 0,
        }
      }

      return {
        items: orderItems,
        total: totalWithBulkDiscount ?? totalWithoutBulkDiscount,
        totalDiscoutOfAllItems,
        cashTotal:
          paymentMethod === 'CASH'
            ? totalWithBulkDiscount ?? totalWithoutBulkDiscount
            : 0,
        cardTotal:
          paymentMethod === 'CARD'
            ? totalWithBulkDiscount ?? totalWithoutBulkDiscount
            : 0,
        customBulkDiscount: totalWithBulkDiscount
          ? totalWithoutBulkDiscount - totalWithBulkDiscount
          : 0,
      }
    }
  }

  private async decrementProductQuantities(
    tx: PrismaTx,
    items?: {
      vtwId: string
      quantity: number
    }[],
  ) {
    if (items && items.length >= 1) {
      await Promise.all(
        items.map(({ quantity, vtwId }) =>
          tx.variantToWarehouse.update({
            where: {
              id: vtwId,
            },
            data: {
              warehouseQuantity: {
                decrement: quantity,
              },
              variant: {
                update: {
                  totalWarehouseQuantity: {
                    decrement: quantity,
                  },
                  product: {
                    update: {
                      totalWarehouseQuantity: {
                        decrement: quantity,
                      },
                    },
                  },
                },
              },
            },
          }),
        ),
      )
    }
  }

  async create(createOrderDto: CreateOrderDto, shiftId: string) {
    const [count, shift] = await Promise.all([
      this.db.order.count(),
      this.getShift(shiftId),
      this.getCustomer(createOrderDto.customerId),
    ])

    if (!shift?.isOpened) {
      throw new BadRequestException('Смена закрыта.')
    }

    if (!shift.pointOfSale?.warehouseId) {
      throw new NotFoundException('Склад не найден.')
    }

    const calculatedOrder = await this.caluclateOrder(
      createOrderDto,
      shift.pointOfSale?.warehouseId,
    )

    if (calculatedOrder) {
      const {
        cashTotal,
        total,
        totalDiscoutOfAllItems,
        cardTotal,
        customBulkDiscount,
        items,
      } = calculatedOrder

      await this.db.$transaction(async (tx) => {
        await Promise.all([
          this.decrementProductQuantities(tx, items),
          tx.orderInvoice.create({
            data: {
              paymentMethod: createOrderDto.paymentMethod,
              order: {
                create: {
                  name: `Продажа #${count + 1}`,
                  shiftId,
                  customerId: createOrderDto.customerId,
                  itemDiscountTotal: totalDiscoutOfAllItems,
                  customBulkDiscount,
                  items: {
                    createMany: {
                      data: items,
                    },
                  },
                },
              },
              totalCardAmount: cardTotal,
              totalCashAmount: cashTotal,
              transactions:
                createOrderDto.paymentMethod === 'MIXED'
                  ? {
                      createMany: {
                        data: [
                          {
                            direction: 'CREDIT',
                            amount: cardTotal ?? 0,
                            type: 'ORDER_PAYMENT',
                            shiftId,
                          },
                          {
                            direction: 'CREDIT',
                            amount: cashTotal ?? 0,
                            type: 'ORDER_PAYMENT',
                            shiftId,
                          },
                        ],
                      },
                    }
                  : {
                      create: {
                        amount: total ?? 0,
                        direction: 'CREDIT',
                        type: 'ORDER_PAYMENT',
                        shiftId,
                      },
                    },
            },
          }),
        ])
      })
    }
  }

  async findAll({
    page,
    rowsPerPage,
    cashierIds,
    customerIds,
    date,
    orderBy,
    paymentMethods,
    query,
    warehouseIds,
    posIds,
  }: FindAllOrderDto) {
    const { skip, take } = getPaginationData({ page, rowsPerPage })

    const where: Prisma.OrderWhereInput = {
      OR: buildContainsArray({ fields: ['name'], query }),
      createdAt: date
        ? {
            gte: date.from ?? undefined,
            lte: date.to ?? undefined,
          }
        : undefined,
      customerId: customerIds
        ? {
            in: customerIds,
          }
        : undefined,
      invoice: paymentMethods
        ? {
            paymentMethod: paymentMethods
              ? {
                  in: paymentMethods,
                }
              : undefined,
          }
        : undefined,
      shift:
        cashierIds || posIds
          ? {
              cashierId: cashierIds
                ? {
                    in: cashierIds,
                  }
                : undefined,
              pointOfSaleId: posIds
                ? {
                    in: posIds,
                  }
                : undefined,
            }
          : undefined,
      items: warehouseIds
        ? {
            some: {
              vtw: {
                warehouseId: {
                  in: warehouseIds,
                },
              },
            },
          }
        : undefined,
    }

    const [items, totalItems] = await Promise.all([
      this.db.order.findMany({
        where,
        take,
        skip,
        orderBy: buildOrderByArray({ orderBy }),
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          invoice: {
            select: {
              paymentMethod: true,
            },
          },
          shift: {
            select: {
              cashier: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
              pointOfSale: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.db.order.count({
        where,
      }),
    ])

    return {
      items,
      info: {
        totalPages: calculateTotalPages(totalItems, take),
        totalItems,
      },
    }
  }

  async findOne(id: string) {
    const order = await this.getOrder(id)

    return order
  }
}
