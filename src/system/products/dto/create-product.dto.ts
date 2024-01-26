import { Type } from 'class-transformer'
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

export class ProductColorDto {
  @IsString()
  @IsNotEmpty()
  colorId: string

  @IsNumber()
  @IsNotEmpty()
  index: number
}

export class ProductMediaDto {
  @IsString()
  @IsNotEmpty()
  id: string

  @IsNumber()
  @IsNotEmpty()
  index: number
}

export class ProductCharacteristicValuesDto {
  @IsNotEmpty()
  @IsString()
  id: string
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  collectionId: string

  @IsString()
  @IsNotEmpty()
  title: string

  @IsString()
  @IsNotEmpty()
  description: string

  @ValidateNested({ each: true })
  @Type(() => ProductColorDto)
  colors: ProductColorDto[]

  @ValidateNested({ each: true })
  @Type(() => ProductMediaDto)
  media: ProductMediaDto[]

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProductCharacteristicValuesDto)
  characteristics?: ProductCharacteristicValuesDto[]

  @IsNotEmpty()
  @IsNumber()
  packagingLength: number

  @IsNotEmpty()
  @IsNumber()
  packagingWidth: number

  @IsNotEmpty()
  @IsNumber()
  packagingHeight: number

  @IsNotEmpty()
  @IsNumber()
  packagingWeight: number
}
