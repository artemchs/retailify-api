import { IsNotEmpty, IsString } from 'class-validator'

export class CreateColorDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsNotEmpty()
  color: string
}
