import { Type } from 'class-transformer'
import {
  IsAlphanumeric,
  IsNotEmpty,
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
  @IsOptional()
  @IsString()
  tin?: string

  @IsOptional()
  @ValidateNested({
    each: true,
  })
  @Type(() => SoleProprietorCurrentAccount)
  currentAccounts?: SoleProprietorCurrentAccount[]
}
