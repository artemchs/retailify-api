import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common'
import { CustomersService } from './customers.service'
import { Throttle, minutes } from '@nestjs/throttler'
import { AccessTokenGuard } from '../auth/guards/access-token.guard'
import { Authenticated } from '../decorators/authenticated.decorator'
import { GetCurrentCustomerAccessToken } from '../decorators/get-current-customer-access-token.decorator'
import { UpdateMeDto } from './dto/update-me.dto'
import { SendOtpDto } from '../auth/dto/send-otp.dto'
import { UpdateMyPhoneNumber } from './dto/update-my-phone-number.dto'

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

  @Throttle({ default: { limit: 3, ttl: minutes(1) } })
  @UseGuards(AccessTokenGuard)
  @Authenticated()
  @Post('send-otp')
  sendOtp(
    @GetCurrentCustomerAccessToken('sub') customerId: string,
    @Body() body: SendOtpDto,
  ) {
    return this.customersService.sendOtp(customerId, body)
  }

  @UseGuards(AccessTokenGuard)
  @Authenticated()
  @Put('my-phone-number')
  updateMyPhoneNumber(
    @GetCurrentCustomerAccessToken('sub') customerId: string,
    @Body() body: UpdateMyPhoneNumber,
  ) {
    return this.customersService.updateMyPhoneNumber(customerId, body)
  }
}
