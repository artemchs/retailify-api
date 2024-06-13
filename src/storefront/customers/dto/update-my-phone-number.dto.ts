import { IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator'
import { TransformPhoneNumber } from 'src/dto-utils/transformPhoneNumber'

export class UpdateMyPhoneNumber {
  @IsNotEmpty()
  @IsPhoneNumber()
  @TransformPhoneNumber()
  phoneNumber: string

  @IsNotEmpty()
  @IsString()
  otp: string
}
