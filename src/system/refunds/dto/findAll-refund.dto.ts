export class FindAllRefundDto {
  page: number
  rowsPerPage: number
  query?: string
  cashierIds?: string[]
  warehouseIds?: string[]
  customerIds?: string[]
  posIds?: string[]
  date?: {
    from?: string
    to?: string
  }
  orderDate?: {
    from?: string
    to?: string
  }
  paymentMethods?: ('CARD' | 'CASH' | 'MIXED')[]
  orderBy?: {
    createdAt?: 'asc' | 'desc'
    updatedAt?: 'asc' | 'desc'
    name?: 'asc' | 'desc'
  }
}

export class FindAllRefundInfiniteListDto {
  query?: string
  cursor?: string
  cashierIds?: string[]
  warehouseIds?: string[]
  customerIds?: string[]
  posIds?: string[]
  date?: {
    from?: string
    to?: string
  }
  orderDate?: {
    from?: string
    to?: string
  }
  paymentMethods?: ('CARD' | 'CASH' | 'MIXED')[]
}
