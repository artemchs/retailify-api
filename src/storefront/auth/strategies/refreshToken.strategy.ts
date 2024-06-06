import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { Request } from 'express'
import { ExtractJwt, Strategy } from 'passport-jwt'

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'storefront-jwt-refresh-token',
) {
  constructor(private config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        RefreshTokenStrategy.extractFromCookies,
      ]),
      secretOrKey: config.get('STOREFRONT_JWT_RT_SECRET'),
      passReqToCallback: true,
    })
  }

  private static extractFromCookies(req: Request): string | null {
    if (
      req.cookies &&
      'storefront-jwt-refresh-token' in req.cookies &&
      req.cookies['storefront-jwt-refresh-token'].length >= 1
    ) {
      return req.cookies['storefront-jwt-refresh-token']
    } else {
      return null
    }
  }

  validate(req: Request, payload: any) {
    const refreshToken = req.cookies['storefront-jwt-refresh-token']

    return {
      ...payload,
      refreshToken,
    }
  }
}
