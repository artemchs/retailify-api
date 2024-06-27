import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator'
import { ProductFields } from '../../types'

/**
 * Data Transfer Object for Import Source Schema
 */
export class ImportSourceSchemaDto {
  /**
   * The field name in the incoming file.
   * @example "product_name"
   */
  @IsNotEmpty()
  @IsString()
  incomingFileField: string

  /**
   * The corresponding field in the product.
   */
  @IsNotEmpty()
  @IsEnum(ProductFields)
  field: ProductFields

  /**
   * Whether the field is an additional parameter without its own column, key, or tag.
   * @example true
   */
  @IsNotEmpty()
  @IsBoolean()
  isAdditionalField: boolean
}

export class CreateSourceDto {
  @IsNotEmpty()
  @IsString()
  name: string

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ImportSourceSchemaDto)
  schema: ImportSourceSchemaDto[]
}
