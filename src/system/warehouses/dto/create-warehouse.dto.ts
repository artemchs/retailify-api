import { IsNotEmpty, IsString } from 'class-validator'

export class CreateWarehouseDto {
  @IsNotEmpty({
    message: 'Пожалуйста, введите имя в виде строки.',
  })
  @IsString({
    message: 'Имя должно быть строкой.',
  })
  name: string

  @IsNotEmpty({
    message: 'Пожалуйста, введите адрес в виде строки.',
  })
  @IsString({
    message: 'Адрес должен быть строкой.',
  })
  address: string
}
