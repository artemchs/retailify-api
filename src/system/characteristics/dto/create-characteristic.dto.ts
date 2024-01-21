import { IsNotEmpty, IsString } from 'class-validator'

export class CreateCharacteristicDto {
  @IsString()
  @IsNotEmpty()
  name: string
}
