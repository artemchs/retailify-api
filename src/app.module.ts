import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { validateENVs } from './env.validation'
import { DbModule } from './db/db.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: validateENVs,
    }),
    DbModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
