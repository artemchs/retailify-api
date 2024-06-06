import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { AccessTokenStrategy } from './strategies/accessToken.strategy'
import { RefreshTokenStrategy } from './strategies/refreshToken.strategy'
import { JwtModule } from '@nestjs/jwt'

@Module({
  controllers: [AuthController],
  providers: [AuthService, AccessTokenStrategy, RefreshTokenStrategy],
  imports: [JwtModule.register({})],
})
export class AuthModule {}
