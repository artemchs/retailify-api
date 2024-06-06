import { CustomerPayloadAccessToken } from './customer-payload-access-token'

export type CustomerPayloadRefreshToken = {
  refreshToken: string
} & CustomerPayloadAccessToken
