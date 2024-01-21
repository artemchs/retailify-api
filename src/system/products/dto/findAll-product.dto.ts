export class FindAllProductDto {
  page: number
  rowsPerPage: number
  query?: string
  orderBy?: {
    createdAt?: 'asc' | 'desc'
    updatedAt?: 'asc' | 'desc'
    title?: 'asc' | 'desc'
    description?: 'asc' | 'desc'
    price?: 'asc' | 'desc'
    sale?: 'asc' | 'desc'
    packagingLength?: 'asc' | 'desc'
    packagingWidth?: 'asc' | 'desc'
    packagingHeight?: 'asc' | 'desc'
    packagingWeight?: 'asc' | 'desc'
    totalStock?: 'asc' | 'desc'
  }
  isArchived?: number // 0 or 1
}
