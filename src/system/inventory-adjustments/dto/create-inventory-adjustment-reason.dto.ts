import { IsNotEmpty, IsString } from 'class-validator'

export class CreateInventoryAdjustmentReasonDto {
  @IsNotEmpty()
  @IsString()
  name: string
}
