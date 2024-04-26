import { IsNotEmpty, IsString } from 'class-validator'

export class CreateVariantAdditionalAttributeDto {
  @IsNotEmpty()
  @IsString()
  name: string
}
