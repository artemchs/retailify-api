import { Module } from '@nestjs/common'
import { FinancialTransactionsService } from './financial-transactions.service'
import { FinancialTransactionsController } from './financial-transactions.controller'

@Module({
  controllers: [FinancialTransactionsController],
  providers: [FinancialTransactionsService],
})
export class FinancialTransactionsModule {}
