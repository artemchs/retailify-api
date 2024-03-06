import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CreateDto, FindAllDto, UpdateDto } from './dto'
import { DbService } from '../../db/db.service'
import { Prisma } from '@prisma/client'
import {
  buildContainsArray,
  buildOrderByArray,
  calculateTotalPages,
} from '../common/utils/db-helpers'
import { hashData } from '../common/utils/hash-data'

@Injectable()
export class EmployeesService {
  constructor(private db: DbService) {}

  async findOne(id: string) {
    const user = await this.db.systemUser.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        profilePictureKey: true,
        role: true,
      },
    })

    if (!user) {
      throw new NotFoundException('Пользователь не найден.')
    }

    return user
  }

  async findAll({ page, rowsPerPage, query, roles, orderBy }: FindAllDto) {
    const limit = Number(rowsPerPage ?? 10)
    const currentPage = Number(page ?? 1)

    const take = limit
    const skip = (currentPage - 1) * limit

    const where: Prisma.SystemUserWhereInput = {
      role: {
        in: roles ? roles : undefined,
      },
      OR: buildContainsArray({
        fields: ['fullName', 'email'],
        query,
      }),
    }

    const [items, totalItems] = await Promise.all([
      this.db.systemUser.findMany({
        where,
        take,
        skip,
        orderBy: buildOrderByArray({ orderBy }),
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePictureKey: true,
          role: true,
        },
      }),
      this.db.systemUser.count({
        where,
      }),
    ])

    const totalPages = calculateTotalPages(totalItems, limit)

    return {
      items,
      info: {
        totalPages,
        totalItems,
      },
    }
  }

  async findAllInfiniteList({
    cursor,
    query,
  }: {
    cursor?: string
    query?: string
  }) {
    const limit = 10

    const where: Prisma.SystemUserWhereInput = {
      OR: buildContainsArray({ fields: ['fullName', 'email'], query }),
    }

    const items = await this.db.systemUser.findMany({
      take: limit + 1,
      where,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    })

    let nextCursor: typeof cursor | undefined = undefined
    if (items.length > limit) {
      const nextItem = items.pop()
      nextCursor = nextItem!.id
    }

    return {
      items,
      nextCursor,
    }
  }

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

  async update({ email, fullName, role }: UpdateDto, id: string) {
    const [user, userWithNewEmail] = await Promise.all([
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

    if (!user) {
      throw new NotFoundException('Пользователь не найден.')
    }

    if (userWithNewEmail) {
      throw new BadRequestException(
        'Этот адресс електронной почты уже используеться другим пользователем.',
      )
    }

    await Promise.all([
      this.db.systemUser.update({
        where: {
          id,
        },
        data: {
          email,
          fullName,
          role,
        },
      }),
      this.updateAllowedEmails(user.email, email),
    ])
  }

  async remove(id: string) {
    const user = await this.db.systemUser.findUnique({
      where: {
        id,
      },
    })

    if (!user) {
      throw new NotFoundException('Пользователь не найден.')
    }

    await Promise.all([
      this.db.systemUser.delete({
        where: {
          id: user.id,
        },
      }),
      this.db.allowedSystemUserEmail.delete({
        where: {
          email: user.email,
        },
      }),
    ])
  }
}
