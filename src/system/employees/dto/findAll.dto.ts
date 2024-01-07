import { SystemUserRole } from '@prisma/client'

export type FindAllDto = {
  page: number
  rowsPerPage: number
  query?: string
  roles?: SystemUserRole[]
  orderBy?: {
    fullName?: 'asc' | 'desc'
    email?: 'asc' | 'desc'
  }
}
