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
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Пароль должен содержать не менее 8 символов и включать буквы верхнего и нижнего регистра, цифры и специальные символы.',
    },
  )
  @IsNotEmpty({
    message: 'Пароль не должен быть пустым.',
  })
  password: string
}
