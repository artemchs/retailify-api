import { Module } from '@nestjs/common'
import { ValuesService } from './values.service'
import { ValuesController } from './values.controller'

@Module({
  controllers: [ValuesController],
  providers: [ValuesService],
})
export class ValuesModule {}
