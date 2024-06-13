import { Response } from 'express'

export function setAccessTokenCookie(response: Response, accessToken: string) {
  response.cookie('storefront-jwt-access-token', accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
  })
}
