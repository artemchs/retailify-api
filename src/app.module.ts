import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { validateENVs } from './env.validation'
import { DbModule } from './db/db.module'
import { SystemModule } from './system/system.module'

const NODE_ENV = process.env.NODE_ENV

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: validateENVs,
      isGlobal: true,
      envFilePath: !NODE_ENV ? '.env' : `.env.${NODE_ENV}`,
    }),
    DbModule,
    SystemModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
