import { IsNotEmpty, IsString } from 'class-validator'
import { IsPhoneNumber } from '../../../dto-utils/IsPhoneNumber'
import { TransformPhoneNumber } from '../../../dto-utils/transformPhoneNumber'

export class ValidateOtpDto {
  @IsNotEmpty()
  @IsPhoneNumber()
  @TransformPhoneNumber()
  phoneNumber: string

  @IsNotEmpty()
  @IsString()
  otp: string
}
