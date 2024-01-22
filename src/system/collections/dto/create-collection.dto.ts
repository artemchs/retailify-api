import { Type } from 'class-transformer'
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

export class CollectionDefaultCharacteristic {
  @IsNotEmpty()
  @IsString()
  id: string
}

export class CollectionProduct {
  @IsNotEmpty()
  @IsString()
  id: string
}

export class CreateCollectionDto {
  @IsNotEmpty()
  @IsString()
  name: string

  @IsOptional()
  @IsString()
  parentId?: string

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CollectionDefaultCharacteristic)
  characteristics?: CollectionDefaultCharacteristic[]

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CollectionProduct)
  products?: CollectionProduct[]
}
