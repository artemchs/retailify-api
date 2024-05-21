import { Injectable } from '@nestjs/common'
import { CreateFinancialTransactionDto } from './dto/create-financial-transaction.dto'
import { UpdateFinancialTransactionDto } from './dto/update-financial-transaction.dto'
import { DbService } from '../../db/db.service'

@Injectable()
export class FinancialTransactionsService {
  constructor(private db: DbService) {}

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

  async findAll() {
    return `This action returns all financialTransactions`
  }

  async findOne(id: string) {
    return `This action returns a #${id} financialTransaction`
  }

  async update(
    id: string,
    updateFinancialTransactionDto: UpdateFinancialTransactionDto,
  ) {
    return `This action updates a #${id} financialTransaction`
  }

  async remove(id: string) {
    return `This action removes a #${id} financialTransaction`
  }
}
