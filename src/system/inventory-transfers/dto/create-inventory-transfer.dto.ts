import { Transform, Type } from 'class-transformer'
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator'

export class InventoryTransferItemDto {
  @IsNotEmpty()
  @IsString()
  id: string

  @IsNotEmpty()
  @IsNumber()
  quantity: number
}

export class InventoryTransferItemWithDestinationWarehouseDto extends InventoryTransferItemDto {
  @IsNotEmpty()
  @IsString()
  destinationWarehouseId: string
}

export class CreateInventoryTransferDto {
  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  date: Date

  @IsNotEmpty()
  @IsString()
  reasonId: string

  @IsNotEmpty()
  @IsString()
  sourceWarehouseId: string

  @IsNotEmpty()
  @IsString()
  destinationWarehouseId: string

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => InventoryTransferItemDto)
  transferItems: InventoryTransferItemDto[]
}
