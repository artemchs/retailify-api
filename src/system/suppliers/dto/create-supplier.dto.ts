import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator'

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsNotEmpty()
  contactPerson: string

  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsPhoneNumber()
  @IsNotEmpty()
  phone: string

  @IsString()
  @IsNotEmpty()
  address: string
}
