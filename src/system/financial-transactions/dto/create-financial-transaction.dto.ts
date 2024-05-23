import { TransactionDirection, TransactionType } from '@prisma/client'
import { Transform } from 'class-transformer'

import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator'

export class CreateFinancialTransactionDto {
  @IsNotEmpty({ message: 'Дата не должна быть пустой' })
  @Transform(({ value }) => new Date(value))
  @IsDate()
  goodsReceiptDate: Date

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
