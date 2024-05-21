import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common'
import { FinancialTransactionsService } from './financial-transactions.service'
import { CreateFinancialTransactionDto } from './dto/create-financial-transaction.dto'
import { FindAllFinancialTransactionsDto } from './dto/findAll-financial-transactions'

@Controller('system/financial-transactions')
export class FinancialTransactionsController {
  constructor(
    private readonly financialTransactionsService: FinancialTransactionsService,
  ) {}

  @Post()
  create(@Body() createFinancialTransactionDto: CreateFinancialTransactionDto) {
    return this.financialTransactionsService.create(
      createFinancialTransactionDto,
    )
  }

  @Get()
  findAll(
    @Query() findAllFinancialTransactionsDto: FindAllFinancialTransactionsDto,
  ) {
    return this.financialTransactionsService.findAll(
      findAllFinancialTransactionsDto,
    )
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.financialTransactionsService.findOne(id)
  }
}
