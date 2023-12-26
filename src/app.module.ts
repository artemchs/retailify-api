import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { validateENVs } from './env.validation'
import { DbModule } from './db/db.module'
import { SystemModule } from './system/system.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: validateENVs,
      isGlobal: true,
    }),
    DbModule,
    SystemModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
