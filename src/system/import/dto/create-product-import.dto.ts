import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateProductImportDto {
  @IsNotEmpty()
  @IsString()
  importSourceId: string

  @IsNotEmpty()
  @IsString()
  fileKey: string

  @IsNotEmpty()
  @IsString()
  warehouseId: string

  @IsOptional()
  @IsString()
  comment?: string
}
