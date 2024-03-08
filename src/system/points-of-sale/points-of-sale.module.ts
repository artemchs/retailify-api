import { Module } from '@nestjs/common'
import { PointsOfSaleService } from './points-of-sale.service'
import { PointsOfSaleController } from './points-of-sale.controller'
import { ShiftsModule } from './shifts/shifts.module'

@Module({
  controllers: [PointsOfSaleController],
  providers: [PointsOfSaleService],
  imports: [ShiftsModule],
})
export class PointsOfSaleModule {}
