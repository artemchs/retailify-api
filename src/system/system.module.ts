import { Module } from '@nestjs/common'
import { AuthModule } from './auth/auth.module'
import { APP_GUARD } from '@nestjs/core'
import { AccessTokenGuard, RolesGuard } from './common/guards'
import { UsersModule } from './users/users.module'
import { EmployeesModule } from './employees/employees.module'
import { SuppliersModule } from './suppliers/suppliers.module'
import { WarehousesModule } from './warehouses/warehouses.module'
import { GoodsReceiptsModule } from './goods-receipts/goods-receipts.module'
import { ProductsModule } from './products/products.module'
import { ColorsModule } from './colors/colors.module'

@Module({
  imports: [
    AuthModule,
    UsersModule,
    EmployeesModule,
    SuppliersModule,
    WarehousesModule,
    GoodsReceiptsModule,
    ProductsModule,
    ColorsModule,
  ],
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
