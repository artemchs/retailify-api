import { TransactionDirection, TransactionType } from '@prisma/client'

export type FindAllFinancialTransactionsDto = {
  page: number
  rowsPerPage: number
  query?: string
  types?: `${TransactionType}`[]
  directions?: `${TransactionDirection}`[]
  systemUserIds?: string[]
  createdAt?: {
    from?: Date
    to?: Date
  }
  orderBy?: {
    fullName?: 'asc' | 'desc'
    email?: 'asc' | 'desc'
  }
}
