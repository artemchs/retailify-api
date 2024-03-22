import { Type } from 'class-transformer'
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

export enum OrderSaleType {
  'FIXED-AMOUNT' = 'FIXED-AMOUNT',
  'PERCENTAGE' = 'PERCENTAGE',
}

export enum OrderPaymentMethod {
  'CASH' = 'CASH',
  'CARD' = 'CARD',
  'MIXED' = 'MIXED',
}

export class OrderItemDto {
  @IsNotEmpty()
  @IsString()
  id: string

  @IsNotEmpty()
  @IsNumber()
  quantity: number

  @IsOptional()
  @IsEnum(OrderSaleType)
  customSaleType?: `${OrderSaleType}`

  @IsOptional()
  @IsNumber()
  customSaleFixedAmount?: number

  @IsOptional()
  @IsNumber()
  customSalePercentage?: number
}

export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  posId: string

  @IsOptional()
  @IsString()
  customerId?: string

  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[]

  @IsNotEmpty()
  @IsEnum(OrderPaymentMethod)
  paymentMethod: `${OrderPaymentMethod}`

  @IsOptional()
  @IsEnum(OrderSaleType)
  customBulkDiscountType?: `${OrderSaleType}`

  @IsOptional()
  @IsNumber()
  customBulkDiscountFixedAmount?: number

  @IsOptional()
  @IsNumber()
  customBulkDiscountPercentage?: number

  @IsOptional()
  @IsNumber()
  totalCashAmount?: number

  @IsOptional()
  @IsNumber()
  totalCardAmount?: number
}
