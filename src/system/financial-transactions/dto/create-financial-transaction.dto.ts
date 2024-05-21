import { TransactionDirection, TransactionType } from '@prisma/client'

import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator'

export class CreateFinancialTransactionDto {
  @IsNotEmpty()
  @IsNumber()
  amount: number

  @IsNotEmpty()
  @IsEnum(TransactionType)
  type: TransactionType

  @IsNotEmpty()
  @IsEnum(TransactionDirection)
  direction: TransactionDirection

  @IsOptional()
  @IsString()
  shiftId?: string

  @IsOptional()
  @IsString()
  orderInvoiceId?: string

  @IsOptional()
  @IsString()
  refundId?: string
}
