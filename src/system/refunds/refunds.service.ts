import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CreateRefundDto } from './dto/create-refund.dto'
import {
  FindAllRefundDto,
  FindAllRefundInfiniteListDto,
} from './dto/findAll-refund.dto'
import {
  buildContainsArray,
  buildOrderByArray,
  calculateTotalPages,
  getPaginationData,
} from '../common/utils/db-helpers'
import { $Enums, Prisma, PrismaClient } from '@prisma/client'
import { DbService } from '../../db/db.service'
import { Decimal, DefaultArgs } from '@prisma/client/runtime/library'

type PrismaTx = Omit<
  PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

@Injectable()
export class RefundsService {
  constructor(private db: DbService) {}

  private async getOrder(id: string) {
    const customer = await this.db.order.findUnique({
      where: {
        id,
      },
      include: {
        invoice: true,
      },
    })

    if (!customer) {
      throw new NotFoundException('Заказ не найден.')
    }

    return customer
  }

  private async getShift(id: string) {
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

  private async getRefund(id: string) {
    const refund = await this.db.refund.findUnique({
      where: {
        id,
      },
      include: {
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
        order: {
          select: {
            invoice: {
              select: {
                paymentMethod: true,
              },
            },
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })

    if (!refund) {
      throw new NotFoundException('Возврат не найден.')
    }

    return refund
  }

  async findOne(id: string) {
    const refund = await this.getRefund(id)

    return refund
  }

  async findAll({
    page,
    rowsPerPage,
    cashierIds,
    customerIds,
    date,
    orderBy,
    orderDate,
    paymentMethods,
    posIds,
    query,
    warehouseIds,
  }: FindAllRefundDto) {
    const { skip, take } = getPaginationData({ page, rowsPerPage })

    const where: Prisma.RefundWhereInput = {
      OR: buildContainsArray({ fields: ['name'], query }),
      createdAt: date
        ? {
            gte: date.from ?? undefined,
            lte: date.to ?? undefined,
          }
        : undefined,
      order:
        orderDate || customerIds || paymentMethods
          ? {
              createdAt: orderDate
                ? {
                    gte: orderDate.from ?? undefined,
                    lte: orderDate.to ?? undefined,
                  }
                : undefined,
              customerId: customerIds
                ? {
                    in: customerIds,
                  }
                : undefined,
              invoice: paymentMethods
                ? {
                    paymentMethod: {
                      in: paymentMethods,
                    },
                  }
                : undefined,
              items: warehouseIds
                ? {
                    some: {
                      vtwId: {
                        in: warehouseIds,
                      },
                    },
                  }
                : undefined,
            }
          : undefined,
      shift:
        posIds || cashierIds
          ? {
              pointOfSaleId: posIds
                ? {
                    in: posIds,
                  }
                : undefined,
              cashierId: cashierIds
                ? {
                    in: cashierIds,
                  }
                : undefined,
            }
          : undefined,
    }

    const [items, totalItems] = await Promise.all([
      this.db.refund.findMany({
        where,
        take,
        skip,
        orderBy: buildOrderByArray({ orderBy }),
        include: {
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
          order: {
            select: {
              invoice: {
                select: {
                  paymentMethod: true,
                },
              },
              customer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
      this.db.refund.count({
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

  async findAllInfiniteList({
    cashierIds,
    cursor,
    customerIds,
    date,
    orderDate,
    paymentMethods,
    posIds,
    query,
    warehouseIds,
  }: FindAllRefundInfiniteListDto) {
    const limit = 10

    const where: Prisma.RefundWhereInput = {
      OR: buildContainsArray({ fields: ['name'], query }),
      createdAt: date
        ? {
            gte: date.from ?? undefined,
            lte: date.to ?? undefined,
          }
        : undefined,
      order:
        orderDate || customerIds || paymentMethods
          ? {
              createdAt: orderDate
                ? {
                    gte: orderDate.from ?? undefined,
                    lte: orderDate.to ?? undefined,
                  }
                : undefined,
              customerId: customerIds
                ? {
                    in: customerIds,
                  }
                : undefined,
              invoice: paymentMethods
                ? {
                    paymentMethod: {
                      in: paymentMethods,
                    },
                  }
                : undefined,
              items: warehouseIds
                ? {
                    some: {
                      vtwId: {
                        in: warehouseIds,
                      },
                    },
                  }
                : undefined,
            }
          : undefined,
      shift:
        posIds || cashierIds
          ? {
              pointOfSaleId: posIds
                ? {
                    in: posIds,
                  }
                : undefined,
              cashierId: cashierIds
                ? {
                    in: cashierIds,
                  }
                : undefined,
            }
          : undefined,
    }

    const items = await this.db.refund.findMany({
      take: limit + 1,
      where,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    })

    let nextCursor: typeof cursor | undefined = undefined
    if (items.length > limit) {
      const nextItem = items.pop()
      nextCursor = nextItem!.id
    }

    return {
      items,
      nextCursor,
    }
  }

  private async calculateRefund(
    tx: PrismaTx,
    refundOrderDto: CreateRefundDto,
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

  async create(refundOrderDto: CreateRefundDto, shiftId: string) {
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
