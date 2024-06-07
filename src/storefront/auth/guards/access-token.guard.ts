import { AuthGuard } from '@nestjs/passport'

export class AccessTokenGuard extends AuthGuard('storefront-jwt-access-token') {
  constructor() {
    super()
  }
}
