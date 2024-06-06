import { IsNotEmpty } from 'class-validator'
import { IsPhoneNumber } from '../../../dto-utils/IsPhoneNumber'
import { TransformPhoneNumber } from '../../../dto-utils/transformPhoneNumber'

export class SignInDto {
  @IsNotEmpty()
  @IsPhoneNumber()
  @TransformPhoneNumber()
  phoneNumber: string
}
