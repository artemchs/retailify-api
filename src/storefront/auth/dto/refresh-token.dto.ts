import { IsNotEmpty, IsString } from 'class-validator'

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  customerId: string

  @IsString()
  @IsNotEmpty()
  refreshToken: string
}
