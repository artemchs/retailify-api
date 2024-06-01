import { Type } from 'class-transformer'
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import {
  ProductCharacteristicDto,
  ProductColorDto,
  ProductMediaDto,
  ProductTagDto,
} from './create-product.dto'
import { ProductGender, ProductSeason } from '@prisma/client'

export class BatchEditProductDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  productIds: string[]

  @IsOptional()
  @IsString()
  supplierSku?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProductTagDto)
  tags?: ProductTagDto[]

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProductMediaDto)
  media?: ProductMediaDto[]

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProductCharacteristicDto)
  characteristics?: ProductCharacteristicDto[]

  @IsOptional()
  @IsString()
  brandId?: string

  @IsOptional()
  @IsString()
  categoryId?: string

  @IsOptional()
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
