import { IsNotEmpty, IsString } from 'class-validator'

export class LogInDto {
  @IsString({
    message: 'Пожалуйста, введите ваше имя пользователя в виде строки.',
  })
  @IsNotEmpty({ message: 'Имя пользователя не должно быть пустым.' })
  username: string

  @IsString({ message: 'Пожалуйста, введите ваш пароль в виде строки.' })
  @IsNotEmpty({ message: 'Пароль не должен быть пустым.' })
  password: string
}
