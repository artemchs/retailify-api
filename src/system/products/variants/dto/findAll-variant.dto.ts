export class FindAllVariantDto {
  page: number
  rowsPerPage: number
  query?: string
  productIds?: string[]
  warehouseIds?: string[]
  posId?: string
  excludeIds?: string[]
  orderBy?: {
    createdAt?: 'asc' | 'desc'
    updatedAt?: 'asc' | 'desc'
    barcode?: 'asc' | 'desc'
    sku?: 'asc' | 'desc'
    supplierSku?: 'asc' | 'desc'
    price?: 'asc' | 'desc'
    sale?: 'asc' | 'desc'
    totalReceivedQuantity?: 'asc' | 'desc'
    totalWarehouseQuantity?: 'asc' | 'desc'
    size?: 'asc' | 'desc'
  }
  isArchived?: number // 0 or 1
}
