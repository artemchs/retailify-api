export class FindAllSupplierDto {
  page: number
  rowsPerPage: number
  query?: string
  orderBy?: {
    name?: 'asc' | 'desc'
    contactPerson?: 'asc' | 'desc'
    email?: 'asc' | 'desc'
    phone?: 'asc' | 'desc'
    address?: 'asc' | 'desc'
  }
  isArchived?: number // 0 or 1
}
