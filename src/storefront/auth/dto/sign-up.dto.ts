import { IsNotEmpty, IsString } from 'class-validator'
import { IsPhoneNumber } from '../../../dto-utils/IsPhoneNumber'
import { TransformPhoneNumber } from '../../../dto-utils/transformPhoneNumber'

export class SignUpDto {
  @IsNotEmpty()
  @IsPhoneNumber()
  @TransformPhoneNumber()
  phoneNumber: string

  @IsNotEmpty()
  @IsString()
  firstName: string

  @IsNotEmpty()
  @IsString()
  lastName: string

  @IsNotEmpty()
  @IsString()
  validatedOtp: string
}
