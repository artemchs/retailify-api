import { Transform, Type } from 'class-transformer'
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator'

export class InventoryAdjustmentVariant {
  @IsNotEmpty()
  @IsString()
  variantToWarehouseId: string

  @IsNotEmpty()
  @IsNumber()
  quantityChange: number
}

export class CreateInventoryAdjustmentDto {
  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  date: Date

  @IsNotEmpty()
  @IsString()
  reasonId: string

  @IsNotEmpty()
  @IsString()
  warehouseId: string

  @ValidateNested({ each: true })
  @Type(() => InventoryAdjustmentVariant)
  variants: InventoryAdjustmentVariant[]
}
