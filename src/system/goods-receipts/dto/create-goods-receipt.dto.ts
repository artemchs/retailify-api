import { SupplierInvoicePaymentOption } from '@prisma/client'
import { Transform, Type } from 'class-transformer'
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator'

export class GoodsReceiptVariant {
  @IsNotEmpty({ message: 'Идентификатор варианта не должен быть пустым' })
  @IsString({ message: 'Идентификатор варианта должен быть строкой' })
  variantId: string

  @IsNotEmpty({ message: 'Цена закупки не должна быть пустой' })
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'Цена закупки должна быть числом' },
  )
  supplierPrice: number

  @IsNotEmpty({ message: 'Количество не должно быть пустым' })
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'Количество должно быть числом' },
  )
  receivedQuantity: number

  @IsNotEmpty()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  sellingPrice?: number
}

export class CreateGoodsReceiptDto {
  @IsNotEmpty({ message: 'Идентификатор поставщика не должен быть пустым' })
  @IsString({ message: 'Идентификатор поставщика должен быть строкой' })
  supplierId: string

  @IsNotEmpty({ message: 'Идентификатор склада не должен быть пустым' })
  @IsString({ message: 'Идентификатор склада должен быть строкой' })
  warehouseId: string

  @IsNotEmpty({ message: 'Дата поступления товара не должна быть пустой' })
  @Transform(({ value }) => new Date(value))
  @IsDate()
  goodsReceiptDate: Date

  @IsNotEmpty({ message: 'Опция оплаты не должна быть пустой' })
  @IsEnum(SupplierInvoicePaymentOption, {
    message: 'Способ оплаты должен быть выбран из списка',
  })
  paymentOption: SupplierInvoicePaymentOption

  @ValidateNested({
    each: true,
    message: 'Варианты товаров должны быть корректными',
  })
  @Type(() => GoodsReceiptVariant)
  variants: GoodsReceiptVariant[]
}
