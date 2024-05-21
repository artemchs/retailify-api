import { Injectable, NotFoundException } from '@nestjs/common'
import { CreateFinancialTransactionDto } from './dto/create-financial-transaction.dto'
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

  async create({
    amount,
    direction,
    type,
    orderInvoiceId,
    refundId,
    shiftId,
  }: CreateFinancialTransactionDto) {
    return await this.db.transaction.create({
      data: {
        amount,
        direction,
        type,
        orderInvoiceId,
        refundId,
        shiftId,
      },
    })
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
