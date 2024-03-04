export class FindAllPointsOfSaleDto {
  page: number
  rowsPerPage: number
  query?: string
  productTagIds?: string[]
  categoryIds?: string[]
  categoryGroupIds?: string[]
  cashierIds?: string[]
  orderBy?: {
    createdAt?: 'asc' | 'desc'
    updatedAt?: 'asc' | 'desc'
    name?: 'asc' | 'desc'
    date?: 'asc' | 'desc'
  }
  isArchived?: number // 0 or 1
}
