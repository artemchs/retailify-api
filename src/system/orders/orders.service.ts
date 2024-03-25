import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CreateOrderDto } from './dto/create-order.dto'
import { UpdateOrderDto } from './dto/update-order.dto'
import { DbService } from '../../db/db.service'
import getDiscountedPrice from '../common/utils/getDiscountedPrice'
import { $Enums, Prisma, PrismaClient } from '@prisma/client'
import { Decimal, DefaultArgs } from '@prisma/client/runtime/library'
import { FindAllOrderDto } from './dto/findAll-order.dto'
import {
  buildContainsArray,
  buildOrderByArray,
  calculateTotalPages,
  getPaginationData,
} from '../common/utils/db-helpers'
import { OrderRefundDto } from './dto/refund-order.dto'

type PrismaTx = Omit<
  PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

@Injectable()
export class OrdersService {
  constructor(private db: DbService) {}

  private async getCustomer(id?: string) {
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

  private async getShift(id?: string) {
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

  private async getOrder(id?: string) {
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
            totalCardAmount: true,
            totalCashAmount: true,
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
      let totalWithoutBulkDiscount = 0
      const orderItems: {
        vtwId: string
        quantity: number
        customDiscount?: number
        pricePerItemWithDiscount: number
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
                      customDiscount = priceWithSale - priceWithCustomSale
                    }

                    totalWithoutBulkDiscount =
                      (priceWithCustomSale ?? priceWithSale) * quantity

                    orderItems.push({
                      quantity,
                      vtwId: vtw.id,
                      customDiscount,
                      pricePerItemWithDiscount:
                        priceWithCustomSale ?? priceWithSale,
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

  private async updateProductQuantities(
    tx: PrismaTx,
    action: 'increment' | 'decrement',
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
                [action]: quantity,
              },
              variant: {
                update: {
                  totalWarehouseQuantity: {
                    [action]: quantity,
                  },
                  product: {
                    update: {
                      totalWarehouseQuantity: {
                        [action]: quantity,
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
      const { cashTotal, total, cardTotal, customBulkDiscount, items } =
        calculatedOrder

      await this.db.$transaction(async (tx) => {
        await Promise.all([
          this.updateProductQuantities(tx, 'decrement', items),
          tx.orderInvoice.create({
            data: {
              paymentMethod: createOrderDto.paymentMethod,
              order: {
                create: {
                  name: `Продажа #${count + 1}`,
                  shiftId,
                  customerId: createOrderDto.customerId,
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

  private async calculateRefund(
    tx: PrismaTx,
    refundOrderDto: OrderRefundDto,
    orderId: string,
    invoice: {
      totalCashAmount: Prisma.Decimal
      totalCardAmount: Prisma.Decimal
      paymentMethod: $Enums.OrderPaymentMethod
    } | null,
    customBulkDiscount: Decimal | null,
  ) {
    const totalWithBulkDiscount = invoice
      ? Number(invoice.totalCardAmount) + Number(invoice.totalCashAmount)
      : 0

    const refundItems: {
      quantity: number
      amount: number
      orderItemId: string
    }[] = []

    await Promise.all(
      refundOrderDto.items.map(async ({ id, quantity }) => {
        const orderItem = await tx.customerOrderItem.findUnique({
          where: {
            id,
          },
        })

        if (!orderItem) {
          console.log({
            orderItemNotFound: id,
            orderId,
            date: new Date(),
          })
          throw new NotFoundException('Товар не найден.')
        }

        const price = Number(orderItem.pricePerItemWithDiscount) * quantity
        const percentOfOrderTotalWithoutDiscount =
          price / totalWithBulkDiscount +
          (customBulkDiscount ? Number(customBulkDiscount) : 0)
        const refundAmountForOrderItem =
          percentOfOrderTotalWithoutDiscount * totalWithBulkDiscount +
          (customBulkDiscount ? Number(customBulkDiscount) : 0)

        refundItems.push({
          amount: refundAmountForOrderItem,
          orderItemId: id,
          quantity,
        })
      }),
    )

    const refundTotal =
      refundItems.length >= 1
        ? refundItems
            .map(({ amount }) => amount)
            .reduce((prev, curr) => prev + curr)
        : 0

    return {
      refundItems,
      refundTotal,
    }
  }

  async refund(refundOrderDto: OrderRefundDto, shiftId: string) {
    const [count, shift, order] = await Promise.all([
      this.db.refund.count(),
      this.getShift(shiftId),
      this.getOrder(refundOrderDto.orderId),
    ])

    if (!shift?.isOpened) {
      throw new BadRequestException('Смена закрыта.')
    }

    await this.db.$transaction(async (tx) => {
      const { refundItems, refundTotal } = await this.calculateRefund(
        tx,
        refundOrderDto,
        order.id,
        order.invoice,
        order.customBulkDiscount,
      )

      await tx.refund.create({
        data: {
          name: `Возврат #${count + 1}`,
          orderId: refundOrderDto.orderId,
          shiftId: shift.id,
          refundItems: {
            createMany: {
              data: refundItems,
            },
          },
          amount: refundTotal,
          transactions: {
            create: {
              amount: refundTotal * -1,
              direction: 'DEBIT',
              type: 'ORDER_REFUND',
              shiftId,
              orderInvoiceId: order.orderInvoiceId,
            },
          },
        },
      })
    })
  }
}
