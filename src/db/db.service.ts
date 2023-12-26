import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class DbService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
    })
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }

  async reset() {
    const environment = this.configService.get<string>('NODE_ENV')

    if (environment === 'production') {
      console.log(
        'WARNING! Tried to reset the database in the production environment. It is not allowed to do so.',
      )
    } else {
      const models = Reflect.ownKeys(this).filter((key) => key[0] !== '_')

      return Promise.all([
        models.map((modelKey) => this[modelKey].deleteMany()),
      ])
    }
  }
}
