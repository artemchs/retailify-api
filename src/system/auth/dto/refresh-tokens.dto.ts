import { IsNotEmpty, IsString } from 'class-validator'

export class RefreshTokensDto {
  @IsString()
  @IsNotEmpty()
  userId: string

  @IsString()
  @IsNotEmpty()
  refreshToken: string
}
