import {
  SupplierInvoicePaymentOption,
  SupplierInvoicePaymentTerm,
} from '@prisma/client'
import { IsDateString, IsEnum, IsNotEmpty, IsString } from 'class-validator'

export class CreateGoodsReceiptDto {
  @IsNotEmpty()
  @IsString()
  supplierId: string

  @IsNotEmpty()
  @IsDateString()
  goodsReceiptDate: Date

  @IsNotEmpty()
  @IsEnum(SupplierInvoicePaymentTerm)
  paymentTerm: SupplierInvoicePaymentTerm

  @IsNotEmpty()
  @IsEnum(SupplierInvoicePaymentOption)
  paymentOption: SupplierInvoicePaymentOption
}
