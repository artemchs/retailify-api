import { SupplierInvoicePaymentOption } from '@prisma/client'

export class FindAllGoodsReceiptDto {
  page: number
  rowsPerPage: number
  query?: string
  warehouseIds?: string[]
  supplierIds?: string[]
  paymentOptions?: SupplierInvoicePaymentOption[]
  goodsReceiptDate?: {
    from?: string
    to?: string
  }
  orderBy?: {
    createdAt?: 'asc' | 'desc'
    updatedAt?: 'asc' | 'desc'
    name?: 'asc' | 'desc'
    goodsReceiptDate?: 'asc' | 'desc'
  }
  isArchived?: number // 0 or 1
}
