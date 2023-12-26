import { ExecutionContext, createParamDecorator } from '@nestjs/common'
import { UserPayloadRefreshToken } from '../types'

export const GetCurrentUserRefreshToken = createParamDecorator(
  <T extends keyof UserPayloadRefreshToken>(
    data: T | null,
    context: ExecutionContext,
  ) => {
    const request = context.switchToHttp().getRequest()
    if (!data) {
      return request.user as UserPayloadRefreshToken
    } else {
      return request.user[data]
    }
  },
)
