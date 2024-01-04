import { Module } from '@nestjs/common'
import { AuthModule } from './auth/auth.module'
import { APP_GUARD } from '@nestjs/core'
import { AccessTokenGuard, RolesGuard } from './common/guards'
import { UsersModule } from './users/users.module'
import { EmployeesModule } from './employees/employees.module'

@Module({
  imports: [AuthModule, UsersModule, EmployeesModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AccessTokenGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class SystemModule {}
