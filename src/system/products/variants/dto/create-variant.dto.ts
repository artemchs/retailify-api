import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateVariantDto {
  @IsNotEmpty()
  @IsString()
  size: string

  @IsNotEmpty()
  @IsString()
  sku: string

  @IsNotEmpty()
  @IsNumber()
  price: number

  @IsOptional()
  @IsNumber()
  sale?: number
}
