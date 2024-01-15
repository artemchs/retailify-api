export function checkIsArchived(isArchived: number | undefined) {
  return isArchived ? Boolean(Number(isArchived)) : false
}

type OrderBy = {
  [key: string]: 'asc' | 'desc' | undefined
}

type BuildOrderByArrayProps = {
  orderBy: OrderBy | undefined
}

export function buildOrderByArray({ orderBy }: BuildOrderByArrayProps):
  | {
      [k: string]: 'asc' | 'desc' | undefined
    }[]
  | {
      createdAt: 'desc'
    } {
  if (!orderBy) return { createdAt: 'desc' }

  const arrayFromEntries = Object.entries(orderBy)

  return arrayFromEntries.map((t) => {
    const key = t[0]
    const value = t[1]

    return {
      [key]: value,
    }
  })
}

type BuildContainsArrayProps = {
  query: string | undefined
  fields: string[]
}

export function buildContainsArray({ fields, query }: BuildContainsArrayProps) {
  if (!query) return undefined

  return fields.map((field) => ({
    [field]: {
      contains: query,
    },
  }))
}

export function calculateTotalPages(totalItems: number, limit: number) {
  return Math.ceil(totalItems / limit)
}

interface GetPaginationDataProps {
  page: number
  rowsPerPage: number
}

export function getPaginationData({
  page,
  rowsPerPage,
}: GetPaginationDataProps) {
  const take = Number(rowsPerPage ?? 10)
  const currentPage = Number(page ?? 1)
  const skip = (currentPage - 1) * take

  return {
    take,
    skip,
  }
}
