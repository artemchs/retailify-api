import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator'

export class UpdateMeDto {
  @IsString({
    message: 'Пожалуйста, введите ваше полное имя в виде строки.',
  })
  @IsNotEmpty({
    message: 'Полное имя не должно быть пустым.',
  })
  fullName: string

  @IsEmail({}, { message: 'Пожалуйста, введите корректный email адрес.' })
  @IsNotEmpty({ message: 'Email не должен быть пустым.' })
  email: string

  @IsPhoneNumber('UA', {
    message: 'Пожалуйста, введите корректный номер телефона для Украины.',
  })
  @IsNotEmpty({ message: 'Номер телефона не должен быть пустым.' })
  phoneNumber: string
}
