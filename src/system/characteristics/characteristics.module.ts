import { Module } from '@nestjs/common'
import { CharacteristicsService } from './characteristics.service'
import { CharacteristicsController } from './characteristics.controller'

@Module({
  controllers: [CharacteristicsController],
  providers: [CharacteristicsService],
})
export class CharacteristicsModule {}
