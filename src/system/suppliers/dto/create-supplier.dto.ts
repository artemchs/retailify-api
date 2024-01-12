import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator'

export class CreateSupplierDto {
  @IsString({
    message: 'Пожалуйста, введите имя в виде строки.',
  })
  @IsNotEmpty({
    message: 'Имя не должно быть пустым.',
  })
  name: string

  @IsString({
    message: 'Пожалуйста, введите контактное лицо в виде строки.',
  })
  @IsNotEmpty({
    message: 'Контактное лицо не должно быть пустым.',
  })
  contactPerson: string

  @IsEmail(undefined, {
    message: 'Пожалуйста, введите корректный адрес электронной почты.',
  })
  @IsNotEmpty({
    message: 'Адрес электронной почты не должен быть пустым.',
  })
  email: string

  @IsPhoneNumber('UA', {
    message: 'Пожалуйста, введите корректный номер телефона.',
  })
  @IsNotEmpty({
    message: 'Номер телефона не должен быть пустым.',
  })
  phone: string

  @IsString({
    message: 'Пожалуйста, введите адрес в виде строки.',
  })
  @IsNotEmpty({
    message: 'Адрес не должен быть пустым.',
  })
  address: string
}
