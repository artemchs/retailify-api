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
import { RefreshTokenGuard } from '../common/guards'
import {
  GetCurrentUserAccessToken,
  GetCurrentUserRefreshToken,
  Public,
} from '../common/decorators'
import { UserPayloadRefreshToken } from '../common/types'

@Controller('system/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post('sign-up')
  signUp(@Body() body: SignUpDto): Promise<Tokens> {
    return this.authService.signUp(body)
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('log-in')
  logIn(@Body() body: LogInDto): Promise<Tokens> {
    return this.authService.logIn(body)
  }

  @HttpCode(HttpStatus.OK)
  @Post('log-out')
  logOut(@GetCurrentUserAccessToken('sub') userId: string) {
    return this.authService.logOut({ userId })
  }

  @Public() // Bypass the access token guard
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
