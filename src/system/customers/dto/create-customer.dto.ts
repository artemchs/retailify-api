import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator'

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

  @IsPhoneNumber('UA', {
    message: 'Пожалуйста, введите корректный номер телефона.',
  })
  @IsNotEmpty({
    message: 'Номер телефона не должен быть пустым.',
  })
  phoneNumber: string
}
