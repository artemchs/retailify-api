import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { SignUpDto, LogInDto, RefreshTokenDto, LogOutDto } from './dto'
import { Tokens } from './types'
import { Request } from 'express'
import { AccessTokenGuard, RefreshTokenGuard } from '../common/guards'

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
  logOut(@Req() req: Request) {
    const user = req.user
    const params: LogOutDto = {
      userId: user?.['sub'],
    }

    return this.authService.logOut(params)
  }

  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  refreshToken(@Req() req: Request) {
    const user = req.user
    const params: RefreshTokenDto = {
      userId: user?.['sub'],
      refreshToken: user?.['refreshToken'],
    }

    return this.authService.refreshToken(params)
  }
}
