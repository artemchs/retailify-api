export enum ProductFields {
  // Product fields
  PRODUCT_ID = 'product_id',
  PRODUCT_TITLE = 'product_title',
  PRODUCT_SKU = 'product_sku',
  PRODUCT_SUPPLIER_SKU = 'product_supplierSku',
  PRODUCT_TORGSOFT_ID = 'product_torgsoftId',
  PRODUCT_PROM_ID = 'product_promId',
  PRODUCT_ROZETKA_ID = 'product_rozetkaId',
  PRODUCT_GENDER = 'product_gender',
  PRODUCT_SEASON = 'product_season',
  PRODUCT_MEDIA = 'product_media',

  // Product variant fields
  VARIANT_ID = 'variant_id',
  VARIANT_TORGSOFT_ID = 'variant_torgsoftId',
  VARIANT_PROM_ID = 'variant_promId',
  VARIANT_ROZETKA_ID = 'variant_rozetkaId',
  VARIANT_SIZE = 'variant_size',
  VARIANT_PRICE = 'variant_price',
  VARIANT_SALE = 'variant_sale',
  VARIANT_QUANTITY = 'variant_quantity',
  VARIANT_BARCODE = 'variant_barcode',
}

export type ProductFieldValues = `${ProductFields}`

export interface ImportItemSchema {
  incomingFileField: string
  field: ProductFields
  isAdditionalField: boolean
}

// Helper type to extract keys with a specific prefix
type PrefixKeys<T, Prefix extends string> = {
  [K in keyof T]: K extends `${Prefix}${string}` ? K : never
}[keyof T]

// Create types for product and variant fields
export type ImportProductFieldsType = {
  [K in PrefixKeys<typeof ProductFields, 'PRODUCT_'>]: string
}

export type ImportVariantFieldsType = {
  [K in PrefixKeys<typeof ProductFields, 'VARIANT_'>]: string
} & {
  additionalFields: AdditionalField[]
}

// AdditionalField type
export type AdditionalField = {
  key: string
  value: string
}

// Final Product type
export type ImportProduct = ImportProductFieldsType & {
  additionalFields: AdditionalField[]
  variants: ImportVariantFieldsType[]
}
