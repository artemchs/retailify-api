import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { Request } from 'express'
import { ExtractJwt, Strategy } from 'passport-jwt'

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'storefront-jwt-access-token',
) {
  constructor(private config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        AccessTokenStrategy.extractFromCookies,
      ]),
      secretOrKey: config.get('STOREFRONT_JWT_AT_SECRET'),
      passReqToCallback: true,
    })
  }

  private static extractFromCookies(req: Request): string | null {
    if (
      req.cookies &&
      'storefront-jwt-access-token' in req.cookies &&
      req.cookies['storefront-jwt-access-token'].length >= 1
    ) {
      return req.cookies['storefront-jwt-access-token']
    } else {
      return null
    }
  }

  validate(req: Request, payload: any) {
    const accessToken = req.cookies['storefront-jwt-access-token']

    return {
      ...payload,
      accessToken,
    }
  }
}
