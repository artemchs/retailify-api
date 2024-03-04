import { Type } from 'class-transformer'
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

class IdDto {
  @IsNotEmpty()
  @IsString()
  id: string
}

export class CreatePointsOfSaleDto {
  @IsNotEmpty()
  @IsString()
  name: string

  @IsNotEmpty()
  @IsString()
  address: string

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => IdDto)
  cashiers: IdDto[]

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => IdDto)
  productTags?: IdDto[]

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => IdDto)
  categoryGroups?: IdDto[]

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => IdDto)
  categories?: IdDto[]
}
