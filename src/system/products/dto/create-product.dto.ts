import { ProductGender, ProductSeason } from '@prisma/client'
import { Type } from 'class-transformer'
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

export class ProductColorDto {
  @IsString()
  @IsNotEmpty()
  id: string

  @IsNotEmpty()
  @IsInt()
  index: number
}

export class ProductMediaDto {
  @IsString()
  @IsNotEmpty()
  id: string

  @IsNotEmpty()
  @IsInt()
  index: number
}

export class ProductCharacteristicValuesDto {
  @IsNotEmpty()
  @IsString()
  id: string
}

export class ProductTagDto {
  @IsNotEmpty()
  @IsString()
  id: string
}

export class ProductVariantDto {
  @IsNotEmpty()
  @IsString()
  size: string

  @IsOptional()
  @IsString()
  id?: string

  @ValidateNested({ each: true })
  @Type(() => ProductVariantAdditionalAttributeDto)
  additionalAttributes?: ProductVariantAdditionalAttributeDto[]
}

export class ProductVariantAdditionalAttributeDto {
  @IsNotEmpty()
  @IsString()
  id: string

  @IsNotEmpty()
  @IsString()
  value: string
}

export class ProductCharacteristicValueDto {
  @IsNotEmpty()
  @IsString()
  id: string
}

export class ProductCharacteristicDto {
  @IsNotEmpty()
  @IsString()
  id: string

  @ValidateNested({ each: true })
  @Type(() => ProductCharacteristicValueDto)
  values: ProductCharacteristicValueDto[]
}

export class CreateProductDto {
  @IsNotEmpty()
  @IsEnum(ProductGender)
  gender: ProductGender

  @IsOptional()
  @IsString()
  supplierSku?: string

  @IsNotEmpty()
  @IsEnum(ProductSeason)
  season: ProductSeason

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
  @Type(() => ProductCharacteristicDto)
  characteristics?: ProductCharacteristicDto[]

  // @IsOptional()
  // @ValidateNested({ each: true })
  // @Type(() => ProductCharacteristicValuesDto)
  // characteristicValues?: ProductCharacteristicValuesDto[]

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[]

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProductTagDto)
  tags?: ProductTagDto[]

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

  @IsNotEmpty()
  @IsString()
  brandId: string
}
