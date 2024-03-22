export default function getDiscountedPrice(
  type: 'PERCENTAGE' | 'FIXED-AMOUNT',
  originalPrice: number,
  sale?: number | null,
) {
  if (type === 'PERCENTAGE') {
    return originalPrice - originalPrice * ((sale ?? 0) / 100)
  } else {
    return originalPrice - (sale ?? 0)
  }
}
