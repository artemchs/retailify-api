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
  isDeleted?: boolean
}
