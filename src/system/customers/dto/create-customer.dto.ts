import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  ValidateIf,
} from 'class-validator'

export class CreateCustomerDto {
  @IsNotEmpty()
  @IsString()
  firstName: string

  @IsNotEmpty()
  @IsString()
  lastName: string

  @ValidateIf((o) => o.email)
  @IsEmail()
  email?: string

  @IsNotEmpty()
  @IsPhoneNumber('UA', {
    message: 'Пожалуйста, введите корректный номер телефона.',
  })
  phoneNumber: string
}
