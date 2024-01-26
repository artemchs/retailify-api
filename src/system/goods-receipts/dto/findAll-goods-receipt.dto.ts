export class FindAllGoodsReceiptDto {
  page: number
  rowsPerPage: number
  query?: string
  orderBy?: {
    createdAt?: 'asc' | 'desc'
    updatedAt?: 'asc' | 'desc'
    name?: 'asc' | 'desc'
    goodsReceiptDate?: 'asc' | 'desc'
  }
}
