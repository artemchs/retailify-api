import { SystemUserRole } from '@prisma/client'

export type UserPayloadAccessToken = {
  sub: string
  role: SystemUserRole
}
