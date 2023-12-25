import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { validateENVs } from './env.validation'

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: validateENVs,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
