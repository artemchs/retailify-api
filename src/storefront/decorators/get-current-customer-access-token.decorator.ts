import { ExecutionContext, createParamDecorator } from '@nestjs/common'
import { CustomerPayloadAccessToken } from '../auth/types/customer-payload-access-token'

export const GetCurrentCustomerAccessToken = createParamDecorator(
  <T extends keyof CustomerPayloadAccessToken>(
    data: T | null,
    context: ExecutionContext,
  ) => {
    const request = context.switchToHttp().getRequest()
    if (!data) {
      return request.user as CustomerPayloadAccessToken
    } else {
      return request.user[data]
    }
  },
)
