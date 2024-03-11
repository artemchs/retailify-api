import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CreateCustomerDto } from './dto/create-customer.dto'
import { UpdateCustomerDto } from './dto/update-customer.dto'
import { DbService } from '../../db/db.service'
import { Prisma } from '@prisma/client'
import {
  buildContainsArray,
  buildOrderByArray,
  calculateTotalPages,
  getPaginationData,
} from '../common/utils/db-helpers'
import { FindAllCustomerDto } from './dto/findAll-customer.dto'

@Injectable()
export class CustomersService {
  constructor(private db: DbService) {}

  private async getCustomer(id: string) {
    const customer = await this.db.customer.findUnique({
      where: {
        id,
      },
    })

    if (!customer) {
      throw new NotFoundException('Покупатель не найден.')
    }

    return customer
  }

  private async checkIfEmailIsTaken(email: string) {
    const customerWithExistingEmail = await this.db.customer.findUnique({
      where: {
        email: email,
      },
    })

    if (customerWithExistingEmail) {
      throw new BadRequestException(
        'Покупатель с таким адресом электронной почты уже зарегистрирован.',
      )
    }
  }

  async create(createCustomerDto: CreateCustomerDto) {
    await this.checkIfEmailIsTaken(createCustomerDto.email)

    await this.db.customer.create({
      data: createCustomerDto,
    })
  }

  async findAll({ page, rowsPerPage, orderBy, query }: FindAllCustomerDto) {
    const { skip, take } = getPaginationData({ page, rowsPerPage })

    const where: Prisma.CustomerWhereInput = {
      OR: buildContainsArray({
        fields: ['firstName', 'lastName', 'email'],
        query,
      }),
    }

    const [items, totalItems] = await Promise.all([
      this.db.customer.findMany({
        where,
        take,
        skip,
        orderBy: buildOrderByArray({ orderBy }),
      }),
      this.db.customer.count({
        where,
      }),
    ])

    return {
      items,
      info: {
        totalPages: calculateTotalPages(totalItems, take),
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

    const where: Prisma.CustomerWhereInput = {
      OR: buildContainsArray({
        fields: ['firstName', 'lastName', 'email'],
        query,
      }),
    }

    const items = await this.db.customer.findMany({
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

  async findOne(id: string) {
    const customer = await this.getCustomer(id)

    return customer
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    await this.getCustomer(id)

    if (updateCustomerDto.email) {
      await this.checkIfEmailIsTaken(updateCustomerDto.email)
    }

    await this.db.customer.update({
      where: {
        id,
      },
      data: updateCustomerDto,
    })
  }

  async remove(id: string) {
    await this.getCustomer(id)

    await this.db.customer.delete({
      where: {
        id,
      },
    })
  }
}
