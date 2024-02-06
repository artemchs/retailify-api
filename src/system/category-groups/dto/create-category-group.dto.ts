import { Type } from 'class-transformer'
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

class CategoryCharacteristic {
  @IsNotEmpty()
  @IsString()
  id: string
}

export class CreateCategoryGroupDto {
  @IsNotEmpty()
  @IsString()
  name: string

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CategoryCharacteristic)
  characteristics?: CategoryCharacteristic[]
}
