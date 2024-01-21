import { IsNotEmpty, IsString } from 'class-validator'

export class CreateValueDto {
  @IsString()
  @IsNotEmpty()
  value: string
}
