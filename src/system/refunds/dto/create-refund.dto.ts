import { Type } from 'class-transformer'
import { IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator'

export class OrderRefundItemDto {
  @IsNotEmpty()
  @IsString()
  id: string

  @IsNotEmpty()
  @IsNumber()
  quantity: number
}

export class CreateRefundDto {
  @IsNotEmpty()
  @IsString()
  orderId: string

  @ValidateNested({ each: true })
  @Type(() => OrderRefundItemDto)
  items: OrderRefundItemDto[]
}
