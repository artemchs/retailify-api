import { TransactionDirection, TransactionType } from '@prisma/client'

export type FindAllFinancialTransactionsDto = {
  page: number
  rowsPerPage: number
  query?: string
  types?: `${TransactionType}`[]
  directions?: `${TransactionDirection}`[]
  systemUserIds?: string[]
  createdAt?: {
    from?: string
    to?: string
  }
  orderBy?: {
    amount?: 'asc' | 'desc'
  }
}
