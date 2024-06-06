import { Module } from '@nestjs/common'
import { AuthModule } from './auth/auth.module'
import { CustomersModule } from './customers/customers.module'

@Module({
  imports: [AuthModule, CustomersModule],
})
export class StorefrontModule {}
