export class FindAllShiftDto {
  page: number
  rowsPerPage: number
  query?: string
  createdAt?: {
    from?: string
    to?: string
  }
  closedAt?: {
    from?: string
    to?: string
  }
  orderBy?: {
    createdAt?: 'asc' | 'desc'
    updatedAt?: 'asc' | 'desc'
    name?: 'asc' | 'desc'
  }
}
