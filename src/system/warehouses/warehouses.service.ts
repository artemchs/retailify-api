import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CreateWarehouseDto } from './dto/create-warehouse.dto'
import { DbService } from '../../db/db.service'
import { FindAllWarehouseDto } from './dto/findAll-warehouse.dto'

import { Prisma } from '@prisma/client'
import { UpdateWarehouseDto } from './dto/update-warehouse.dto'
import {
  buildContainsArray,
  buildOrderByArray,
  calculateTotalPages,
  checkIsArchived,
  getPaginationData,
} from '../common/utils/db-helpers'
import { FindAllInfiniteListWarehouseDto } from './dto/findAllInfiniteList-warehouse.dto'
import { DEFAULT_PRISMA_LIMIT } from '../common/constants'

@Injectable()
export class WarehousesService {
  constructor(private db: DbService) {}

  private async getWarehouse(id: string) {
    const warehouse = await this.db.warehouse.findUnique({
      where: {
        id,
      },
    })

    if (!warehouse) {
      throw new NotFoundException('Склад не найден.')
    }

    return warehouse
  }

  async create(createWarehouseDto: CreateWarehouseDto) {
    await this.db.warehouse.create({
      data: createWarehouseDto,
    })
  }

  async findAll({
    page,
    rowsPerPage,
    isArchived,
    orderBy,
    query,
  }: FindAllWarehouseDto) {
    const { skip, take } = getPaginationData({ page, rowsPerPage })

    const where: Prisma.WarehouseWhereInput = {
      isArchived: checkIsArchived(isArchived),
      OR: buildContainsArray({
        fields: ['name', 'address'],
        query,
      }),
    }

    const [items, totalItems] = await Promise.all([
      this.db.warehouse.findMany({
        where,
        take,
        skip,
        orderBy: buildOrderByArray({ orderBy }),
      }),
      this.db.warehouse.count({
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
  }: FindAllInfiniteListWarehouseDto) {
    const where: Prisma.WarehouseWhereInput = {
      OR: buildContainsArray({
        fields: ['name', 'address'],
        query,
      }),
      isArchived: false,
    }

    const items = await this.db.warehouse.findMany({
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
    const warehouse = await this.getWarehouse(id)

    return warehouse
  }

  async update(id: string, updateWarehouseDto: UpdateWarehouseDto) {
    await this.getWarehouse(id)

    await this.db.warehouse.update({
      where: {
        id,
      },
      data: updateWarehouseDto,
    })
  }

  async archive(id: string) {
    await this.getWarehouse(id)

    await this.db.warehouse.update({
      where: {
        id,
      },
      data: {
        isArchived: true,
      },
    })
  }

  async restore(id: string) {
    await this.getWarehouse(id)

    const variantsWithPositiveQuantity = await this.db.variant.count({
      where: {
        warehouseStockEntries: {
          some: {
            warehouseQuantity: {
              gt: 0,
            },
            warehouseId: id,
          },
        },
      },
    })

    const variantsWithNegativeQuantity = await this.db.variant.count({
      where: {
        warehouseStockEntries: {
          some: {
            warehouseQuantity: {
              lt: 0,
            },
            warehouseId: id,
          },
        },
      },
    })

    if (variantsWithPositiveQuantity !== 0) {
      throw new BadRequestException(
        `Найдено ${variantsWithPositiveQuantity} вариантов товара с количеством больше чем 0. Рекомендуеться провести перемещение между складами или инвентаризацию.`,
      )
    }

    if (variantsWithNegativeQuantity !== 0) {
      throw new BadRequestException(
        `Найдено ${variantsWithPositiveQuantity} вариантов товара с количеством меньше чем 0. Рекомендуеться провести перемещение между складами или инвентаризацию.`,
      )
    }

    await this.db.warehouse.update({
      where: {
        id,
      },
      data: {
        isArchived: false,
      },
    })
  }

  async getAll() {
    return await this.db.warehouse.findMany({
      select: {
        id: true,
        name: true,
      },
      where: {
        isArchived: false,
      },
    })
  }
}
