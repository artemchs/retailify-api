import { hash } from 'argon2'

export function hashData(data: string | Buffer) {
  return hash(data)
}
