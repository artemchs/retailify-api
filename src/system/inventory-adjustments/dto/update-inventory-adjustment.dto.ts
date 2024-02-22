import { PartialType } from '@nestjs/mapped-types'
import { CreateInventoryAdjustmentDto } from './create-inventory-adjustment.dto'

export class UpdateInventoryAdjustmentDto extends PartialType(
  CreateInventoryAdjustmentDto,
) {}
