import { Response } from 'express'

export function setRefreshTokenCookie(
  response: Response,
  refreshToken: string,
) {
  response.cookie('storefront-jwt-refresh-token', refreshToken, {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
  })
}
