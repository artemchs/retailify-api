import { Module } from '@nestjs/common'
import { CharacteristicsService } from './characteristics.service'
import { CharacteristicsController } from './characteristics.controller'
import { ValuesModule } from './values/values.module';

@Module({
  controllers: [CharacteristicsController],
  providers: [CharacteristicsService],
  imports: [ValuesModule],
})
export class CharacteristicsModule {}
