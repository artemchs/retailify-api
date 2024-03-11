export class FindAllVariantDto {
  page: number
  rowsPerPage: number
  query?: string
  productIds?: string[]
  warehouseIds?: string[]
  posId?: string
  orderBy?: {
    createdAt?: 'asc' | 'desc'
    updatedAt?: 'asc' | 'desc'
    size?: 'asc' | 'desc'
    price?: 'asc' | 'desc'
    sale?: 'asc' | 'desc'
    totalReceivedQuantity?: 'asc' | 'desc'
    totalWarehouseQuantity?: 'asc' | 'desc'
  }
  isArchived?: number // 0 or 1
}
