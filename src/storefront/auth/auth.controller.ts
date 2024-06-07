import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
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
import { setAccessTokenCookie } from './utils/set-access-token'
import { Authenticated } from '../decorators/authenticated.decorator'
import { AccessTokenGuard } from './guards/access-token.guard'

@Controller('storefront/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private removeRefreshTokenCookie(response: Response) {
    response.cookie('storefront-jwt-refresh-token', '', {
      expires: new Date(),
    })
  }

  private removeAccessTokenCookie(response: Response) {
    response.cookie('storefront-jwt-access-token', '', {
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
    const isValid = await this.authService.validateOtp(body)

    if (!isValid)
      throw new BadRequestException('Код, який ви надіслали, є недійсним.')

    const customer = await this.authService.getCustomer(body.phoneNumber)

    if (!customer) throw new NotFoundException('You should sign up.')

    const { accessToken, refreshToken } = await this.authService.signIn(
      customer.id,
    )
    setRefreshTokenCookie(response, refreshToken)
    setAccessTokenCookie(response, accessToken)
  }

  @Post('sign-up')
  async signUp(
    @Body() body: SignUpDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.signUp(body)
    setRefreshTokenCookie(response, refreshToken)
    setAccessTokenCookie(response, accessToken)
  }

  @UseGuards(AccessTokenGuard)
  @Authenticated()
  @Post('sign-out')
  async signOut(
    @GetCurrentCustomerAccessToken('sub') customerId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.removeRefreshTokenCookie(response)
    this.removeAccessTokenCookie(response)
    return this.authService.signOut({ customerId })
  }

  @UseGuards(RefreshTokenGuard)
  @Authenticated()
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
    setAccessTokenCookie(response, accessToken)
  }
}
