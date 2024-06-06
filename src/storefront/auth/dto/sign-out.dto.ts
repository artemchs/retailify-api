import { IsNotEmpty, IsString } from 'class-validator'

export class SignOutDto {
  @IsNotEmpty()
  @IsString()
  customerId: string
}
