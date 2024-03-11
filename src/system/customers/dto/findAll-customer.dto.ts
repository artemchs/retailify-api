export class FindAllCustomerDto {
  page: number
  rowsPerPage: number
  query?: string
  orderBy?: {
    createdAt?: 'asc' | 'desc'
    updatedAt?: 'asc' | 'desc'
    firstName?: 'asc' | 'desc'
    lastName?: 'asc' | 'desc'
    email?: 'asc' | 'desc'
  }
}
