import { PartialType } from '@nestjs/mapped-types'
import { CreateInventoryTransferReasonDto } from './create-inventory-transfer-reason.dto'

export class UpdateInventoryTransferReasonDto extends PartialType(
  CreateInventoryTransferReasonDto,
) {}
