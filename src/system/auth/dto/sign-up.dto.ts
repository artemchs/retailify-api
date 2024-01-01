import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator'

export class SignUpDto {
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

  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 3,
      minUppercase: 2,
      minNumbers: 2,
      minSymbols: 1,
    },
    {
      message:
        'Пожалуйста, убедитесь, что ваш пароль состоит как минимум из 8 символов, включает 2 заглавные буквы, 3 строчные буквы, 2 цифры (0-9) и 1 специальный символ (!@#$&*).',
    },
  )
  @IsNotEmpty({
    message: 'Пароль не должен быть пустым.',
  })
  password: string
}
