import { IsNotEmpty, IsString } from 'class-validator'

export class CreateInventoryTransferReasonDto {
  @IsNotEmpty()
  @IsString()
  name: string
}
