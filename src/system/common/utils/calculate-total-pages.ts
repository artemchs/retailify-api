export function calculateTotalPages(totalItems: number, limit: number) {
  return Math.ceil(totalItems / limit)
}
