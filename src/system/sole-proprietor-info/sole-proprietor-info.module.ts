import { Module } from '@nestjs/common'
import { SoleProprietorInfoService } from './sole-proprietor-info.service'
import { SoleProprietorInfoController } from './sole-proprietor-info.controller'

@Module({
  controllers: [SoleProprietorInfoController],
  providers: [SoleProprietorInfoService],
})
export class SoleProprietorInfoModule {}
