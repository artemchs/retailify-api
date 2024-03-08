import { IsNotEmpty, IsNumber } from 'class-validator'

export class CreateShiftDto {
  @IsNotEmpty()
  @IsNumber()
  startingCashBalance: number
}
