import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { validateENVs } from './env.validation'
import { DbModule } from './db/db.module'
import { SystemModule } from './system/system.module'
import { ScheduleModule } from '@nestjs/schedule'
import { SmsModule } from './sms/sms.module';
import { StorefrontModule } from './storefront/storefront.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateENVs,
    }),
    DbModule,
    SystemModule,
    ScheduleModule.forRoot(),
    SmsModule,
    StorefrontModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
