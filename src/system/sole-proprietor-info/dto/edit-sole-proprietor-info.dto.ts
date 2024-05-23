import { Type } from 'class-transformer'
import {
  IsAlphanumeric,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
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
  @IsNotEmpty()
  @IsNumber()
  tin: number

  @IsNotEmpty()
  @IsPhoneNumber('UA', {
    message: 'Пожалуйста, введите корректный номер телефона.',
  })
  phoneNumber: string

  @IsNotEmpty()
  @IsString()
  taxAddress: string

  @IsNotEmpty()
  @IsString()
  taxGroup: string

  @IsOptional()
  @ValidateNested({
    each: true,
  })
  @Type(() => SoleProprietorCurrentAccount)
  currentAccounts?: SoleProprietorCurrentAccount[]
}
