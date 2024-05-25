import { IsNotEmpty, IsString } from 'class-validator'

export class CreateCustomOperationDto {
  @IsNotEmpty()
  @IsString()
  name: string
}
