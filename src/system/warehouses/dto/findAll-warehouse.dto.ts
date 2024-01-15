export class FindAllWarehouseDto {
  page: number
  rowsPerPage: number
  query?: string
  orderBy?: {
    name?: 'asc' | 'desc'
    address?: 'asc' | 'desc'
  }
  isArchived?: number // 0 or 1
}
