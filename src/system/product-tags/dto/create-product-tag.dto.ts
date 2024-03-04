import { IsNotEmpty, IsString } from 'class-validator'

export class CreateProductTagDto {
  @IsNotEmpty()
  @IsString()
  name: string
}
