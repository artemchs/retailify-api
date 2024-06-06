import { AuthGuard } from '@nestjs/passport'

export class RefreshTokenGuard extends AuthGuard(
  'storefront-jwt-refresh-token',
) {
  constructor() {
    super()
  }
}
