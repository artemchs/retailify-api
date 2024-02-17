import { Type } from 'class-transformer'
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import { ProductColorDto } from './create-product.dto'
import { ProductGender, ProductSeason } from '@prisma/client'

export class ProductsInBatchEditingDto {
  @IsNotEmpty()
  @IsString()
  id: string

  @IsOptional()
  @IsString()
  brandId?: string

  @IsOptional()
  @IsString()
  categoryId?: string

  @IsOptional()
  @IsString()
  @ValidateNested({ each: true })
  @Type(() => ProductColorDto)
  colors?: ProductColorDto[]

  @IsOptional()
  @IsEnum(ProductGender)
  gender?: ProductGender

  @IsOptional()
  @IsEnum(ProductSeason)
  season?: ProductSeason

  @IsOptional()
  @IsNumber()
  packagingLength?: number

  @IsOptional()
  @IsNumber()
  packagingWidth?: number

  @IsOptional()
  @IsNumber()
  packagingHeight?: number

  @IsOptional()
  @IsNumber()
  packagingWeight?: number
}

export class BatchEditProductDto {
  @ValidateNested({ each: true })
  @Type(() => ProductsInBatchEditingDto)
  products: ProductsInBatchEditingDto[]
}
