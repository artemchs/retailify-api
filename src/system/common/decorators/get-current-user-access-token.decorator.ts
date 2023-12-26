import { ExecutionContext, createParamDecorator } from '@nestjs/common'
import { UserPayloadAccessToken } from '../types'

export const GetCurrentUserAccessToken = createParamDecorator(
  <T extends keyof UserPayloadAccessToken>(
    data: T | null,
    context: ExecutionContext,
  ) => {
    const request = context.switchToHttp().getRequest()
    if (!data) {
      return request.user as UserPayloadAccessToken
    } else {
      return request.user[data]
    }
  },
)
