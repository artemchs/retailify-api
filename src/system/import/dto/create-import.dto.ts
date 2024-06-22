import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateImportDto {
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
