export class FindAllCategoryGroupDto {
  page: number
  rowsPerPage: number
  query?: string
  orderBy?: {
    createdAt?: 'asc' | 'desc'
    updatedAt?: 'asc' | 'desc'
    name?: 'asc' | 'desc'
  }
  isArchived?: number // 0 or 1
}

export class FindAllInfiniteListCategoryGroupDto {
  query?: string
  cursor?: string
}
