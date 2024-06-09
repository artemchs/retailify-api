import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { validateENVs } from './env.validation'
import { DbModule } from './db/db.module'
import { SystemModule } from './system/system.module'
import { ScheduleModule } from '@nestjs/schedule'
import { SmsModule } from './sms/sms.module'
import { StorefrontModule } from './storefront/storefront.module'
import { ThrottlerGuard, ThrottlerModule, minutes } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'

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
    ThrottlerModule.forRoot([
      {
        ttl: minutes(1),
        limit: 150,
      },
    ]),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
