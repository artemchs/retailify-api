import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

export class LogInDto {
  @IsEmail({}, { message: 'Пожалуйста, введите корректный email адрес.' })
  @IsNotEmpty({ message: 'Email не должен быть пустым.' })
  email: string

  @IsString({ message: 'Пожалуйста, введите ваш пароль в виде строки.' })
  @IsNotEmpty({ message: 'Пароль не должен быть пустым.' })
  password: string
}
