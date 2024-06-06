import { ExecutionContext, createParamDecorator } from '@nestjs/common'
import { CustomerPayloadRefreshToken } from '../auth/types/customer-payload-refresh-token'

export const GetCurrentCustomerRefreshToken = createParamDecorator(
  <T extends keyof CustomerPayloadRefreshToken>(
    data: T | null,
    context: ExecutionContext,
  ) => {
    const request = context.switchToHttp().getRequest()
    if (!data) {
      return request.user as CustomerPayloadRefreshToken
    } else {
      return request.user[data]
    }
  },
)
