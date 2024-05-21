import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common'
import { FinancialTransactionsService } from './financial-transactions.service'
import { CreateFinancialTransactionDto } from './dto/create-financial-transaction.dto'
import { UpdateFinancialTransactionDto } from './dto/update-financial-transaction.dto'

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
  findAll() {
    return this.financialTransactionsService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.financialTransactionsService.findOne(id)
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateFinancialTransactionDto: UpdateFinancialTransactionDto,
  ) {
    return this.financialTransactionsService.update(
      id,
      updateFinancialTransactionDto,
    )
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.financialTransactionsService.remove(id)
  }
}
