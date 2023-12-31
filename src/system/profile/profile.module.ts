import { Module } from '@nestjs/common'
import { ProfileController } from './profile.controller'
import { ProfileService } from './profile.service'
import { AccessTokenStrategy } from '../auth/strategies'

@Module({
  controllers: [ProfileController],
  providers: [ProfileService, AccessTokenStrategy],
})
export class ProfileModule {}
