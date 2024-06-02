import { ProductGender, ProductSeason } from '@prisma/client'

export class FindAllProductDto {
  page: number
  rowsPerPage: number
  query?: string
  colorIds?: string[]
  characteristicValueIds?: string[]
  tagIds?: string[]
  productSeasons?: ProductSeason[]
  productGenders?: ProductGender[]
  categoryIds?: string[]
  brandIds?: string[]
  orderBy?: {
    title: 'asc' | 'desc'
    createdAt: 'asc' | 'desc'
    sku: 'asc' | 'desc'
    supplierSku: 'asc' | 'desc'
    totalReceivedQuantity: 'asc' | 'desc'
    totalWarehouseQuantity: 'asc' | 'desc'
  }
  isArchived?: number // 0 or 1
}
