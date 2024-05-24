import { Injectable, NotFoundException } from '@nestjs/common'
import {
  CreateFinancialTransactionDto,
  CreateFinancialTransactionType,
} from './dto/create-financial-transaction.dto'
import { DbService } from '../../db/db.service'
import { FindAllFinancialTransactionsDto } from './dto/findAll-financial-transactions'
import {
  buildOrderByArray,
  calculateTotalPages,
  getPaginationData,
} from '../common/utils/db-helpers'
import { Prisma } from '@prisma/client'

@Injectable()
export class FinancialTransactionsService {
  constructor(private db: DbService) {}

  private async getTransaction(id: string) {
    const data = await this.db.transaction.findUnique({
      where: {
        id,
      },
    })

    if (!data) {
      throw new NotFoundException('Транзакция не найдена.')
    }

    return data
  }

  private async getSupplier(id: string) {
    const supplier = await this.db.supplier.findUnique({
      where: {
        id,
      },
    })

    if (!supplier) {
      throw new NotFoundException('Поставщик не найден.')
    }

    return supplier
  }

  async create({
    amount,
    date,
    type,
    comment,
    customOperationId,
    supplierId,
  }: CreateFinancialTransactionDto) {
    if (type === CreateFinancialTransactionType.OTHER) {
      return await this.db.transaction.create({
        data: {
          amount,
          direction: 'CREDIT',
          type: 'OTHER',
          date,
          customOperation: {
            connect: {
              id: customOperationId,
            },
          },
          comment,
        },
      })
    } else if (
      type === CreateFinancialTransactionType.SUPPLIER_PAYMENT &&
      supplierId
    ) {
      await this.getSupplier(supplierId)

      await Promise.all([
        this.db.supplier.update({
          where: {
            id: supplierId,
          },
          data: {
            totalOutstandingBalance: {
              decrement: amount,
            },
          },
        }),
        this.db.transaction.create({
          data: {
            amount,
            direction: 'CREDIT',
            type: 'SUPPLIER_PAYMENT',
            date,
            comment,
            supplierId,
          },
        }),
      ])
    }
  }

  async findAll({
    page,
    rowsPerPage,
    createdAt,
    directions,
    orderBy,
    systemUserIds,
    types,
  }: FindAllFinancialTransactionsDto) {
    const { skip, take } = getPaginationData({ page, rowsPerPage })

    const where: Prisma.TransactionWhereInput = {
      createdAt: createdAt
        ? {
            gte: createdAt.from ?? undefined,
            lte: createdAt.to ?? undefined,
          }
        : undefined,
      direction: directions
        ? {
            in: directions,
          }
        : undefined,
      type: types
        ? {
            in: types,
          }
        : undefined,
      shift: systemUserIds
        ? {
            cashier: {
              id: {
                in: systemUserIds,
              },
            },
          }
        : undefined,
    }

    const [items, totalItems] = await Promise.all([
      this.db.transaction.findMany({
        where,
        take,
        skip,
        orderBy: buildOrderByArray({ orderBy }),
        include: {
          orderInvoice: true,
          refund: true,
          shift: true,
        },
      }),
      this.db.transaction.count({
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
    return this.getTransaction(id)
  }
}
