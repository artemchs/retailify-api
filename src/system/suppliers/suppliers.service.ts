import { Injectable, NotFoundException } from '@nestjs/common'
import { CreateSupplierDto } from './dto/create-supplier.dto'
import { UpdateSupplierDto } from './dto/update-supplier.dto'
import { DbService } from '../../db/db.service'
import { FindAllSupplierDto } from './dto/findAll-supplier.dto'
import { Prisma } from '@prisma/client'
import {
  buildContainsArray,
  buildOrderByArray,
  calculateTotalPages,
  checkIsArchived,
  getPaginationData,
} from '../common/utils/db-helpers'
import { FindAllInfiniteListSupplierDto } from './dto/findAllInfiniteList-supplier.dto'
import { DEFAULT_PRISMA_LIMIT } from '../common/constants'

@Injectable()
export class SuppliersService {
  constructor(private db: DbService) {}

  private async getSupplier(id: string) {
    const supplier = await this.db.supplier.findUnique({
      where: {
        id,
      },
    })

    if (!supplier) {
      throw new NotFoundException('Поставщик не найден.')
    }

    return supplier
  }

  async create(createSupplierDto: CreateSupplierDto) {
    await this.db.supplier.create({
      data: createSupplierDto,
    })
  }

  async findAll({
    page,
    rowsPerPage,
    orderBy,
    query,
    isArchived,
  }: FindAllSupplierDto) {
    const { skip, take } = getPaginationData({ page, rowsPerPage })

    const where: Prisma.SupplierWhereInput = {
      isArchived: checkIsArchived(isArchived),
      OR: buildContainsArray({
        fields: ['name', 'contactPerson', 'email', 'phone', 'address'],
        query,
      }),
    }

    const [items, totalItems] = await Promise.all([
      this.db.supplier.findMany({
        where,
        take,
        skip,
        orderBy: buildOrderByArray({ orderBy }),
      }),
      this.db.supplier.count({
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

  async findAllInfiniteList({ cursor, query }: FindAllInfiniteListSupplierDto) {
    const where: Prisma.SupplierWhereInput = {
      OR: buildContainsArray({
        fields: ['name', 'contactPerson', 'email', 'phone', 'address'],
        query,
      }),
      isArchived: false,
    }

    const items = await this.db.supplier.findMany({
      take: DEFAULT_PRISMA_LIMIT + 1,
      where,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    })

    let nextCursor: typeof cursor | undefined = undefined
    if (items.length > DEFAULT_PRISMA_LIMIT) {
      const nextItem = items.pop()
      nextCursor = nextItem!.id
    }

    return {
      items,
      nextCursor,
    }
  }

  async findOne(id: string) {
    const supplier = await this.getSupplier(id)

    return supplier
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto) {
    await this.getSupplier(id)

    await this.db.supplier.update({
      where: {
        id,
      },
      data: updateSupplierDto,
    })
  }

  async archive(id: string) {
    await this.getSupplier(id)

    await this.db.supplier.update({
      where: {
        id,
      },
      data: {
        isArchived: true,
      },
    })
  }

  async restore(id: string) {
    await this.getSupplier(id)

    await this.db.supplier.update({
      where: {
        id,
      },
      data: {
        isArchived: false,
      },
    })
  }
}
