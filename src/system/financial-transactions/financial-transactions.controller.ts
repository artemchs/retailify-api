import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Put,
  UseGuards,
} from '@nestjs/common'
import { FinancialTransactionsService } from './financial-transactions.service'
import { CreateFinancialTransactionDto } from './dto/create-financial-transaction.dto'
import { FindAllFinancialTransactionsDto } from './dto/findAll-financial-transactions'
import { UpdateFinancialTransactionDto } from './dto/update-financial-transaction.dto'
import { AccessTokenGuard, RolesGuard } from '../common/guards'
import { Roles } from '../common/decorators'
import { Role } from '../common/enums'

@Controller('system/financial-transactions')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(Role.Admin)
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
}
