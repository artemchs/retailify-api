import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { SignUpDto, LogInDto } from './dto'
import { AccessTokenGuard, RefreshTokenGuard } from '../common/guards'
import {
  GetCurrentUserAccessToken,
  GetCurrentUserRefreshToken,
  Public,
} from '../common/decorators'
import { UserPayloadRefreshToken } from '../common/types'
import { Response } from 'express'
import { setRefreshTokenCookie } from '../common/utils/set-refresh-token'

@UseGuards(AccessTokenGuard)
@Controller('system/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  removeRefreshTokenCookie(response: Response) {
    response.cookie('jwt-refresh-token', '', {
      expires: new Date(),
    })
  }

  @Public()
  @HttpCode(HttpStatus.CREATED)
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

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('log-in')
  async logIn(
    @Body() body: LogInDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.logIn(body)
    setRefreshTokenCookie(response, refreshToken)

    return {
      accessToken,
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('log-out')
  logOut(
    @GetCurrentUserAccessToken('sub') userId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.removeRefreshTokenCookie(response)
    return this.authService.logOut({ userId })
  }

  @Public() // Bypass the access token guard
  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  async refreshToken(
    @GetCurrentUserRefreshToken() user: UserPayloadRefreshToken,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.refreshToken({
      userId: user.sub,
      refreshToken: user.refreshToken,
    })
    setRefreshTokenCookie(response, refreshToken)

    return {
      accessToken,
    }
  }
}
