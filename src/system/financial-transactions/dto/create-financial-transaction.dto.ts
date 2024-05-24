import { Transform } from 'class-transformer'
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator'

export enum CreateFinancialTransactionType {
  SUPPLIER_PAYMENT = 'SUPPLIER_PAYMENT',
  OTHER = 'OTHER',
}

export class CreateFinancialTransactionDto {
  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  date: Date

  @IsNotEmpty()
  @IsNumber()
  amount: number

  @IsNotEmpty()
  @IsEnum(CreateFinancialTransactionType)
  type: CreateFinancialTransactionType

  @ValidateIf((o) => o.type === CreateFinancialTransactionType.SUPPLIER_PAYMENT)
  @IsNotEmpty()
  @IsString()
  supplierId?: string

  @ValidateIf((o) => o.type === CreateFinancialTransactionType.OTHER)
  @IsNotEmpty()
  @IsString()
  customOperationId?: string

  @IsOptional()
  @IsString()
  comment?: string
}
