import { Module } from '@nestjs/common';
import { PointsOfSaleService } from './points-of-sale.service';
import { PointsOfSaleController } from './points-of-sale.controller';

@Module({
  controllers: [PointsOfSaleController],
  providers: [PointsOfSaleService]
})
export class PointsOfSaleModule {}
