import { UserPayloadAccessToken } from './user-payload-access-token.type'

export type UserPayloadRefreshToken = {
  refreshToken: string
} & UserPayloadAccessToken
