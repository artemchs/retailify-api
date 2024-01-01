import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { UpdateMeDto } from './dto/update-me.dto'
import { DbService } from '../../db/db.service'
import { StorageService } from '../../storage/storage.service'

@Injectable()
export class UsersService {
  constructor(
    private db: DbService,
    private storage: StorageService,
  ) {}

  async updateMe(
    { email, fullName }: UpdateMeDto,
    id: string,
    profilePicture?: Buffer,
  ) {
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

    if (profilePicture) {
      const profilePictureKey = `profile_pictures/${existingUser.id}.jpg`

      await this.storage.uploadFile(profilePictureKey, profilePicture)
      await this.db.systemUser.update({
        where: {
          id,
        },
        data: {
          profilePictureKey,
        },
      })
    }

    await this.db.systemUser.update({
      where: {
        id,
      },
      data: {
        email,
        fullName,
      },
    })
  }
}
