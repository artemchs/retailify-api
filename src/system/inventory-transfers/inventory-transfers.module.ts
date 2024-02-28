import { Module } from '@nestjs/common'
import { InventoryTransfersService } from './inventory-transfers.service'
import { InventoryTransfersController } from './inventory-transfers.controller'

@Module({
  controllers: [InventoryTransfersController],
  providers: [InventoryTransfersService],
})
export class InventoryTransfersModule {}
