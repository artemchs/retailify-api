import { BadRequestException, Injectable } from '@nestjs/common'
import { CreateDto } from './dto'
import { DbService } from '../../db/db.service'
import { hashData } from '../common/utils'
import { FindAllDto } from './dto/findAll.dto'
import { Prisma } from '@prisma/client'

@Injectable()
export class EmployeesService {
  constructor(private db: DbService) {}

  async findAll({ page, rowsPerPage, query, roles, orderBy }: FindAllDto) {
    const limit = Number(rowsPerPage ?? 10)
    const currentPage = Number(page ?? 1)

    const take = limit
    const skip = (currentPage - 1) * limit

    const where: Prisma.SystemUserWhereInput = {
      role: {
        not: 'ADMIN',
        in: roles ? roles : undefined,
      },
      OR: query
        ? [
            {
              fullName: {
                contains: query,
              },
            },
            {
              email: {
                contains: query,
              },
            },
          ]
        : undefined,
    }

    const [items, totalItems] = await Promise.all([
      this.db.systemUser.findMany({
        where,
        take,
        skip,
        orderBy: orderBy
          ? [
              {
                fullName: orderBy.fullName ? orderBy.fullName : undefined,
              },
              {
                email: orderBy.email ? orderBy.email : undefined,
              },
            ]
          : {
              createdAt: 'desc',
            },
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

    const totalPages = Math.ceil(totalItems / limit)

    return {
      items,
      info: {
        totalPages,
        totalItems,
      },
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
}