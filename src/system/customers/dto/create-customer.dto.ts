import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

export class CreateCustomerDto {
  @IsNotEmpty()
  @IsString()
  firstName: string

  @IsNotEmpty()
  @IsString()
  lastName: string

  @IsNotEmpty()
  @IsEmail()
  email: string
}
