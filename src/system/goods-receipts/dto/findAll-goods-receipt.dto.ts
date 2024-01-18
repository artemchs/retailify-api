export class FindAllGoodsReceiptDto {
  page: number
  rowsPerPage: number
  query?: string
  orderBy?: {
    createdAt?: 'asc' | 'desc'
    updatedAt?: 'asc' | 'desc'
    goodsReceiptDate?: 'asc' | 'desc'
  }
  isArchived?: number // 0 or 1
}
