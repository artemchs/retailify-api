import { BadRequestException, Injectable } from '@nestjs/common'
import { CreateDto } from './dto'
import { DbService } from '../../db/db.service'
import { hashData } from '../common/utils'

@Injectable()
export class EmployeesService {
  constructor(private db: DbService) {}

  async create({ email, fullName, password }: CreateDto) {
    const existingUser = await this.db.systemUser.findUnique({
      where: {
        email,
      },
    })

    if (existingUser) {
      throw new BadRequestException(
        'Этот адресс електронной почты уже используеться другим пользователем.',
      )
    }

    const hash = await hashData(password)

    await Promise.all([
      this.db.systemUser.create({
        data: {
          email,
          fullName,
          hash,
        },
      }),
      this.db.allowedSystemUserEmail.create({
        data: {
          email,
        },
      }),
    ])
  }
}
