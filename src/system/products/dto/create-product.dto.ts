import { ProductGender, ProductSeason } from '@prisma/client'
import { Type } from 'class-transformer'
import {
  IsEnum,
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
  @IsNotEmpty()
  @IsEnum(ProductGender)
  gender: ProductGender

  @IsNotEmpty()
  @IsEnum(ProductSeason)
  season: ProductSeason

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

  @IsNotEmpty()
  @IsString()
  categoryId: string
}
