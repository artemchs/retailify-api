import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { UpdateMeDto } from './dto/update-me.dto'
import { DbService } from '../../../src/db/db.service'

@Injectable()
export class ProfileService {
  constructor(private db: DbService) {}

  async updateMe({ email, fullName, phoneNumber }: UpdateMeDto, id: string) {
    const [existingUser, userWithTheSameEmail] = await Promise.all([
      this.db.systemUser.findUnique({
        where: {
          id,
        },
      }),
      this.db.systemUser.findUnique({
        where: {
          email,
          NOT: {
            id,
          },
        },
      }),
    ])

    if (!existingUser) {
      throw new NotFoundException('Пользователь с таким id не найден.')
    } else if (userWithTheSameEmail) {
      throw new BadRequestException(
        'Этот email адресс уже используеться другим пользователем.',
      )
    }

    await this.db.systemUser.update({
      where: {
        id,
      },
      data: {
        email,
        fullName,
        phoneNumber,
      },
    })
  }
}
