import { Transform } from 'class-transformer'

export function TransformPhoneNumber() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      // Remove all non-digit characters
      const digits = value.replace(/\D/g, '')
      // Assume the number is an international number (e.g., adding + if not present)
      return digits.startsWith('0') ? `+${digits.substring(1)}` : `+${digits}`
    }
    return value
  })
}
