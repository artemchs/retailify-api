import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common'
import { CustomersService } from './customers.service'
import { Throttle, minutes } from '@nestjs/throttler'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { Authenticated } from '../decorators/authenticated.decorator'
import { GetCurrentCustomerAccessToken } from '../decorators/get-current-customer-access-token.decorator'
import { UpdateMeDto } from './dto/update-me.dto'

@Throttle({ default: { ttl: minutes(1), limit: 100 } })
@Controller('storefront/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @UseGuards(AccessTokenGuard)
  @Authenticated()
  @Get('me')
  getMe(@GetCurrentCustomerAccessToken('sub') customerId: string) {
    return this.customersService.getMe(customerId)
  }

  @UseGuards(AccessTokenGuard)
  @Authenticated()
  @Put('me')
  updateMe(
    @GetCurrentCustomerAccessToken('sub') customerId: string,
    @Body() body: UpdateMeDto,
  ) {
    return this.customersService.updateMe(customerId, body)
  }
}
