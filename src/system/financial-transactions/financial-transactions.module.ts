import { Module } from '@nestjs/common'
import { FinancialTransactionsService } from './financial-transactions.service'
import { FinancialTransactionsController } from './financial-transactions.controller'
import { CustomOperationsModule } from './custom-operations/custom-operations.module';

@Module({
  controllers: [FinancialTransactionsController],
  providers: [FinancialTransactionsService],
  imports: [CustomOperationsModule],
})
export class FinancialTransactionsModule {}
