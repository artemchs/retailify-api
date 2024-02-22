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
import { CharacteristicsModule } from './characteristics/characteristics.module'
import { VariantsModule } from './products/variants/variants.module'
import { BrandsModule } from './brands/brands.module'
import { StorageModule } from './storage/storage.module'
import { CategoryGroupsModule } from './category-groups/category-groups.module'
import { CategoriesModule } from './categories/categories.module'
import { InventoryAdjustmentsModule } from './inventory-adjustments/inventory-adjustments.module'

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
    CharacteristicsModule,
    VariantsModule,
    BrandsModule,
    StorageModule,
    CategoryGroupsModule,
    CategoriesModule,
    InventoryAdjustmentsModule,
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
