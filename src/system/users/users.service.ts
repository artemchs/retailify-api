import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { UpdateMeDto } from './dto/update-me.dto'
import { DbService } from '../../db/db.service'
import { StorageService } from '../storage/storage.service'
import { hashData } from '../common/utils/hash-data'

@Injectable()
export class UsersService {
  constructor(
    private db: DbService,
    private storage: StorageService,
  ) {}

  async getMe(userId: string) {
    const user = await this.db.systemUser.findUnique({
      where: {
        id: userId,
      },
      select: {
        email: true,
        fullName: true,
        profilePictureKey: true,
      },
    })

    if (!user) {
      throw new NotFoundException('Пользователь с таким id не найден.')
    }

    let profilePicture: string | null = null

    if (user.profilePictureKey) {
      profilePicture = await this.storage.generatePresignedGetUrl(
        user.profilePictureKey,
      )
    }

    return {
      email: user.email,
      fullName: user.fullName,
      profilePicture,
    }
  }

  async uploadProfilePicture(userId: string, profilePicture?: Buffer) {
    if (profilePicture) {
      const profilePictureKey = `profile_pictures/${userId}.jpg`

      await Promise.all([
        this.db.systemUser.update({
          where: {
            id: userId,
          },
          data: {
            profilePictureKey,
          },
        }),
        this.storage.uploadFile(profilePictureKey, profilePicture),
      ])
    }
  }

  async updateAllowedEmails(oldEmail: string, newEmail: string) {
    if (oldEmail !== newEmail) {
      await Promise.all([
        this.db.allowedSystemUserEmail.delete({
          where: { email: oldEmail },
        }),
        this.db.allowedSystemUserEmail.create({
          data: {
            email: newEmail,
          },
        }),
      ])
    }
  }

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
    }

    if (userWithTheSameEmail) {
      throw new BadRequestException(
        'Этот адрес електронной почты уже используеться другим пользователем.',
      )
    }

    await Promise.all([
      this.uploadProfilePicture(existingUser.id, profilePicture),
      this.db.systemUser.update({
        where: {
          id,
        },
        data: {
          email,
          fullName,
        },
      }),
      this.updateAllowedEmails(existingUser.email, email),
    ])
  }

  async updatePassword(newPassword: string, userId: string) {
    const user = await this.db.systemUser.findUnique({
      where: {
        id: userId,
      },
    })

    if (!user) {
      throw new NotFoundException('Пользователь с таким id не найден.')
    }

    const hash = await hashData(newPassword)

    await this.db.systemUser.update({
      where: {
        id: user.id,
      },
      data: {
        hash,
        rtHash: null,
      },
    })
  }
}
