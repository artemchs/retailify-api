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
import { UpdateFinancialTransactionDto } from './dto/update-financial-transaction.dto'

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
          isManual: true,
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
            isManual: true,
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
          customOperation: true,
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

  async update(
    id: string,
    updateFinancialTransactionDto: UpdateFinancialTransactionDto,
  ) {
    const transaction = await this.getTransaction(id)
    const updatedAmount = updateFinancialTransactionDto.amount ?? 0
    const transactionAmount = Number(transaction.amount)

    // Update the basic info of the transaction
    await this.db.transaction.update({
      where: { id },
      data: updateFinancialTransactionDto,
    })

    const isSupplierPayment =
      updateFinancialTransactionDto.type === 'SUPPLIER_PAYMENT'
    const isOtherType = updateFinancialTransactionDto.type === 'OTHER'
    const isAmountChanged = updatedAmount !== transactionAmount
    const isSupplierChanged =
      updateFinancialTransactionDto.supplierId !== transaction.supplierId

    if (isSupplierPayment) {
      if (isSupplierChanged) {
        // If the supplier has changed, update the balances of both old and new suppliers
        if (transaction.supplierId) {
          // Increment the outstanding balance of the old supplier
          await this.db.supplier.update({
            where: { id: transaction.supplierId },
            data: {
              totalOutstandingBalance: {
                increment: transactionAmount,
              },
            },
          })
        }

        // Decrement the outstanding balance of the new supplier
        if (updateFinancialTransactionDto.supplierId) {
          await this.db.supplier.update({
            where: { id: updateFinancialTransactionDto.supplierId },
            data: {
              totalOutstandingBalance: {
                decrement: updatedAmount,
              },
            },
          })
        }
      } else if (isAmountChanged) {
        // If the amount has changed but the supplier remains the same
        await this.db.supplier.update({
          where: { id: updateFinancialTransactionDto.supplierId },
          data: {
            totalOutstandingBalance: {
              decrement: updatedAmount - transactionAmount,
            },
          },
        })
      }
    }

    if (isOtherType && transaction.type === 'SUPPLIER_PAYMENT') {
      // If the transaction type has changed from SUPPLIER_PAYMENT to OTHER, increment the outstanding balance of the old supplier
      if (transaction.supplierId) {
        await this.db.supplier.update({
          where: { id: transaction.supplierId },
          data: {
            totalOutstandingBalance: {
              increment: transactionAmount,
            },
          },
        })
      }
    }
  }
}
