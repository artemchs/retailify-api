import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator'

export class SignUpDto {
  @IsString()
  @IsNotEmpty()
  fullName: string

  @IsString()
  @IsNotEmpty()
  username: string

  @IsStrongPassword()
  @IsNotEmpty()
  password: string
}
