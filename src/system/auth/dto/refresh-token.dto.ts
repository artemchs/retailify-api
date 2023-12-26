import { IsNotEmpty, IsString } from 'class-validator'

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  userId: string

  @IsString()
  @IsNotEmpty()
  refreshToken: string
}
