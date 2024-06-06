import { Injectable, NotFoundException } from '@nestjs/common'
import { DbService } from '../../db/db.service'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { CustomerPayloadAccessToken } from './types/customer-payload-access-token'
import { Tokens } from './types/tokens'
import { hashData } from 'src/system/common/utils/hash-data'

@Injectable()
export class AuthService {
  constructor(
    private db: DbService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async signTokens(payload: CustomerPayloadAccessToken): Promise<Tokens> {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: 60 * 10,
        secret: this.config.get('STOREFRONT_JWT_AT_SECRET'),
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: 60 * 60 * 24 * 7,
        secret: this.config.get('STOREFRONT_JWT_RT_SECRET'),
      }),
    ])

    return {
      accessToken: at,
      refreshToken: rt,
    }
  }

  async updateRefreshTokenHash(customerId: string, refreshToken: string) {
    const customer = await this.db.customer.findUnique({
      where: {
        id: customerId,
      },
    })

    if (!customer) {
      throw new NotFoundException('Customer has not been found.')
    }

    const rtHash = await hashData(refreshToken)

    await this.db.customer.update({
      where: {
        id: customerId,
      },
      data: {
        rtHash,
      },
    })
  }
}
