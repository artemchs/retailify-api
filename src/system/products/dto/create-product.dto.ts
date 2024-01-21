import { Type } from 'class-transformer'
import { IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator'

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

export class CreateProductDto {
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

  @IsNumber()
  @IsNotEmpty()
  price: number

  sale?: number

  @IsNumber()
  @IsNotEmpty()
  packagingLength: number

  @IsNumber()
  @IsNotEmpty()
  packagingWidth: number

  @IsNumber()
  @IsNotEmpty()
  packagingHeight: number

  @IsNumber()
  @IsNotEmpty()
  packagingWeight: number
}
