import { Module } from '@nestjs/common'
import { InventoryAdjustmentsService } from './inventory-adjustments.service'
import { InventoryAdjustmentsController } from './inventory-adjustments.controller'

@Module({
  controllers: [InventoryAdjustmentsController],
  providers: [InventoryAdjustmentsService],
})
export class InventoryAdjustmentsModule {}
