import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { DbService } from '../../db/db.service'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { CustomerPayloadAccessToken } from './types/customer-payload-access-token'
import { Tokens } from './types/tokens'
import { hashData } from 'src/system/common/utils/hash-data'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import * as argon2 from 'argon2'
import { SendOtpDto } from './dto/send-otp.dto'
import { SmsService } from '../../sms/sms.service'

@Injectable()
export class AuthService {
  constructor(
    private db: DbService,
    private jwtService: JwtService,
    private smsService: SmsService,
    private config: ConfigService,
  ) {}

  async sendOtp({ phoneNumber }: SendOtpDto) {
    const otp = Math.floor(1000 + Math.random() * 9000).toString()
    const hash = await hashData(otp)
    await this.db.customerOtp.create({
      data: {
        hash,
      },
    })
    return this.smsService.sendOtp(phoneNumber, otp)
  }

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

  async refreshToken({ customerId, refreshToken }: RefreshTokenDto) {
    const customer = await this.db.customer.findUnique({
      where: {
        id: customerId,
      },
    })

    if (!customer) {
      throw new NotFoundException('Customer has not been found.')
    }

    if (!customer.rtHash) {
      throw new UnauthorizedException('Access denied.')
    }

    const rtMatches = await argon2.verify(customer.rtHash, refreshToken)

    if (!rtMatches) {
      throw new UnauthorizedException('Access denied.')
    }

    const payload: CustomerPayloadAccessToken = {
      sub: customer.id,
    }

    const tokens = await this.signTokens(payload)

    await this.updateRefreshTokenHash(customer.id, tokens.refreshToken)

    return tokens
  }
}
