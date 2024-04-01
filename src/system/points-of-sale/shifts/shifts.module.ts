import { Module } from '@nestjs/common'
import { ShiftsService } from './shifts.service'
import { ShiftsController } from './shifts.controller'
import { FiscalApiModule } from '../../../system/fiscal-api/fiscal-api.module'

@Module({
  controllers: [ShiftsController],
  providers: [ShiftsService],
})
export class ShiftsModule {}
