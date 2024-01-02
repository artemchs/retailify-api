import { IsNotEmpty, IsStrongPassword } from 'class-validator'
import { Match } from '../../common/decorators'

export class UpdatePasswordDto {
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

  @IsNotEmpty({ message: 'Подтверждение пароля не должно быть пустым.' })
  @Match('password', { message: 'Пароли должны совпадать.' })
  passwordConfirm: string
}
