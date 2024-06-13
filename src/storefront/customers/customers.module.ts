import { Module } from '@nestjs/common'
import { CustomersService } from './customers.service'
import { CustomersController } from './customers.controller'
import { SmsModule } from '../../sms/sms.module'

@Module({
  controllers: [CustomersController],
  providers: [CustomersService],
  imports: [SmsModule],
})
export class CustomersModule {}
