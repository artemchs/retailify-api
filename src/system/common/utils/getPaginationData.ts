interface QueryProps {
  page: number
  rowsPerPage: number
}

export default function getPaginationData({ page, rowsPerPage }: QueryProps) {
  const take = Number(rowsPerPage ?? 10)
  const currentPage = Number(page ?? 1)
  const skip = (currentPage - 1) * take

  return {
    take,
    skip,
  }
}
