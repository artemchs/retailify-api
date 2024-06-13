import { IsNotEmpty, IsString } from 'class-validator'

export class UpdateMeDto {
  @IsNotEmpty()
  @IsString()
  firstName: string

  @IsNotEmpty()
  @IsString()
  lastName: string
}
