import {
  SupplierInvoicePaymentOption,
  SupplierInvoicePaymentTerm,
} from '@prisma/client'
import { Type } from 'class-transformer'
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator'

export class GoodsReceiptVariant {
  @IsNotEmpty()
  @IsString()
  variantId: string

  @IsNotEmpty()
  @IsNumber()
  supplierPrice: number

  @IsNotEmpty()
  @IsNumber()
  receivedQuantity: number
}

export class CreateGoodsReceiptDto {
  @IsNotEmpty()
  @IsString()
  supplierId: string

  @IsNotEmpty()
  @IsString()
  warehouseId: string

  @IsNotEmpty()
  @IsDateString()
  goodsReceiptDate: Date

  @IsNotEmpty()
  @IsEnum(SupplierInvoicePaymentTerm)
  paymentTerm: SupplierInvoicePaymentTerm

  @IsNotEmpty()
  @IsEnum(SupplierInvoicePaymentOption)
  paymentOption: SupplierInvoicePaymentOption

  @ValidateNested({ each: true })
  @Type(() => GoodsReceiptVariant)
  variants: GoodsReceiptVariant[]
}
