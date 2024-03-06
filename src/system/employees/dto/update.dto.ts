import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator'

export class UpdateDto {
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
}
