import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator'

export enum ProductField {
  // Product fields
  PRODUCT_TITLE = 'product_title',
  PRODUCT_SKU = 'product_sku',
  PRODUCT_SUPPLIER_SKU = 'product_supplierSku',
  PRODUCT_TORGSOFT_ID = 'product_torgsoftId',
  PRODUCT_PROM_ID = 'product_promId',
  PRODUCT_ROZETKA_ID = 'product_rozetkaId',

  // Product variant fields
  VARIANT_TORGSOFT_ID = 'variant_torgsoftId',
  VARIANT_PROM_ID = 'variant_promId',
  VARIANT_ROZETKA_ID = 'variant_rozetkaId',
  VARIANT_SIZE = 'variant_size',
  VARIANT_PRICE = 'variant_price',
  VARIANT_SALE = 'variant_sale',
}

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
   * The corresponding field in the product. Check the "ProductField" enum that can be imported from this file.
   */
  @IsNotEmpty()
  @IsEnum(ProductField)
  field: ProductField

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
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => ImportSourceSchemaDto)
  schema: ImportSourceSchemaDto[]
}
