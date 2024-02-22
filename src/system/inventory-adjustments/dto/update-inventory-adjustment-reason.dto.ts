import { PartialType } from '@nestjs/mapped-types'
import { CreateInventoryAdjustmentReasonDto } from './create-inventory-adjustment-reason.dto'

export class UpdateInventoryAdjustmentReasonDto extends PartialType(
  CreateInventoryAdjustmentReasonDto,
) {}
