import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { SignUpDto, LogInDto } from './dto'
import { Tokens } from './types'
import { AccessTokenGuard, RefreshTokenGuard } from '../common/guards'
import {
  GetCurrentUserAccessToken,
  GetCurrentUserRefreshToken,
} from '../common/decorators'
import { UserPayloadRefreshToken } from '../common/types'

@Controller('system/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('sign-up')
  signUp(@Body() body: SignUpDto): Promise<Tokens> {
    return this.authService.signUp(body)
  }

  @HttpCode(HttpStatus.OK)
  @Post('log-in')
  logIn(@Body() body: LogInDto): Promise<Tokens> {
    return this.authService.logIn(body)
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Post('log-out')
  logOut(@GetCurrentUserAccessToken('sub') userId: string) {
    return this.authService.logOut({ userId })
  }

  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  refreshToken(@GetCurrentUserRefreshToken() user: UserPayloadRefreshToken) {
    return this.authService.refreshToken({
      userId: user.sub,
      refreshToken: user.refreshToken,
    })
  }
}
