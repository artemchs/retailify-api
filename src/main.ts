import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import * as cookieParser from 'cookie-parser'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000
  app.useGlobalPipes(new ValidationPipe())
  app.use(cookieParser())
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  })
  await app.listen(port)
}
bootstrap()
