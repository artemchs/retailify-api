import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator'

export class CreateDto {
  @IsString({
    message: 'Пожалуйста, введите полное имя работника в виде строки.',
  })
  @IsNotEmpty({
    message: 'Полное имя не должно быть пустым.',
  })
  fullName: string

  @IsEmail(
    {},
    { message: 'Пожалуйста, введите корректный адрес електронной почты.' },
  )
  @IsNotEmpty({ message: 'Адрес електронной почты не должен быть пустым.' })
  email: string

  @IsEnum(['CASHIER', 'ECOMMERCE_MANAGER', 'ADMIN'], {
    message:
      'Пожалуйста, выберите допустимую роль: Админ, Кассир или Ecommerce менеджер.',
  })
  @IsNotEmpty({ message: 'Роль не должна быть пустой.' })
  role: 'CASHIER' | 'ECOMMERCE_MANAGER' | 'ADMIN'

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
        'Пожалуйста, убедитесь, что пароль работника состоит как минимум из 8 символов, включает 2 заглавные буквы, 3 строчные буквы, 2 цифры (0-9) и 1 специальный символ (!@#$&*).',
    },
  )
  @IsNotEmpty({
    message: 'Пароль не должен быть пустым.',
  })
  password: string
}
