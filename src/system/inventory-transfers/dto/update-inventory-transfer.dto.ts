import { PartialType } from '@nestjs/mapped-types'
import { CreateInventoryTransferDto } from './create-inventory-transfer.dto'

export class UpdateInventoryTransferDto extends PartialType(
  CreateInventoryTransferDto,
) {}
