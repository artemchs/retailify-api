export class FindAllInventoryAdjustmentDto {
  page: number
  rowsPerPage: number
  query?: string
  warehouseIds?: string[]
  reasonIds?: string[]
  date?: {
    from?: string
    to?: string
  }
  orderBy?: {
    createdAt?: 'asc' | 'desc'
    updatedAt?: 'asc' | 'desc'
    name?: 'asc' | 'desc'
    date?: 'asc' | 'desc'
  }
  isArchived?: number // 0 or 1
}
