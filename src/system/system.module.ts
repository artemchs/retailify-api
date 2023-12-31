import { Module } from '@nestjs/common'
import { AuthModule } from './auth/auth.module'
import { APP_GUARD } from '@nestjs/core'
import { AccessTokenGuard } from './common/guards'
import { ProfileModule } from './profile/profile.module'

@Module({
  imports: [AuthModule, ProfileModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AccessTokenGuard,
    },
  ],
})
export class SystemModule {}
