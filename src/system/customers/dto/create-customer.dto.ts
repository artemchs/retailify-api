import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator'

export class CreateCustomerDto {
  @IsNotEmpty()
  @IsString()
  firstName: string

  @IsNotEmpty()
  @IsString()
  lastName: string

  @IsOptional()
  @IsEmail()
  email: string

  @IsNotEmpty()
  @IsPhoneNumber('UA', {
    message: 'Пожалуйста, введите корректный номер телефона.',
  })
  phoneNumber: string
}
