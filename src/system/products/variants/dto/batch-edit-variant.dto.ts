import {
  ArrayNotEmpty,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator'

export class BatchEditVariantDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  variantIds: string[]

  @IsOptional()
  @IsNumber()
  sale?: number
}
