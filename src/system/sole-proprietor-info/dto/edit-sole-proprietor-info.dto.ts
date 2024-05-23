import { Type } from 'class-transformer'
import {
  IsAlphanumeric,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator'

export class SoleProprietorCurrentAccount {
  @IsOptional()
  @IsString()
  id?: string

  @IsNotEmpty()
  @IsAlphanumeric()
  @MaxLength(34)
  iban: string

  @IsNotEmpty()
  @IsString()
  name: string
}

export class EditSoleProprietorInfoDto {
  @IsNumber()
  tin?: number

  @IsOptional()
  @ValidateNested({
    each: true,
  })
  @Type(() => SoleProprietorCurrentAccount)
  currentAccounts?: SoleProprietorCurrentAccount[]
}
