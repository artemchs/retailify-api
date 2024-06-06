import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { SendOtpDto } from './dto/send-otp.dto'
import { ValidateOtpDto } from './dto/validate-otp.dto'
import { SignUpDto } from './dto/sign-up.dto'
import { setRefreshTokenCookie } from './utils/set-refresh-token'
import { Response } from 'express'
import { GetCurrentCustomerAccessToken } from '../decorators/get-current-customer-access-token.decorator'
import { RefreshTokenGuard } from './guards/refresh-token.guard'
import { GetCurrentCustomerRefreshToken } from '../decorators/get-current-customer-refresh-token.decorator'
import { CustomerPayloadRefreshToken } from './types/customer-payload-refresh-token'

@Controller('storefront/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private removeRefreshTokenCookie(response: Response) {
    response.cookie('storefront-jwt-refresh-token', '', {
      expires: new Date(),
    })
  }

  @Post('send-otp')
  async sendOtp(@Body() body: SendOtpDto) {
    return this.authService.sendOtp(body)
  }

  @Post('validate-otp')
  async validateOtp(
    @Body() body: ValidateOtpDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const isValid = this.authService.validateOtp(body)

    if (!isValid)
      throw new BadRequestException('Код, який ви надіслали, є недійсним.')

    const customer = await this.authService.getCustomer(body.phoneNumber)

    if (!customer) return // do something here

    const { accessToken, refreshToken } = await this.authService.signIn(
      customer.id,
    )
    setRefreshTokenCookie(response, refreshToken)

    return {
      accessToken,
    }
  }

  @Post('sign-up')
  async signUp(
    @Body() body: SignUpDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.signUp(body)
    setRefreshTokenCookie(response, refreshToken)

    return {
      accessToken,
    }
  }

  @Post('sign-out')
  async signOut(
    @GetCurrentCustomerAccessToken('sub') customerId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.removeRefreshTokenCookie(response)
    return this.authService.signOut({ customerId })
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh-token')
  async refreshToken(
    @GetCurrentCustomerRefreshToken() customer: CustomerPayloadRefreshToken,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.refreshToken({
      customerId: customer.sub,
      refreshToken: customer.refreshToken,
    })
    setRefreshTokenCookie(response, refreshToken)

    return {
      accessToken,
    }
  }
}
