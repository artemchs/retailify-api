import { Injectable, NotFoundException } from '@nestjs/common'
import { CreateVariantDto } from './dto/create-variant.dto'
import { UpdateVariantDto } from './dto/update-variant.dto'
import { DbService } from '../../../db/db.service'
import { FindAllVariantDto } from './dto/findAll-variant.dto'
import {
  buildContainsArray,
  buildOrderByArray,
  calculateTotalPages,
  checkIsArchived,
  getPaginationData,
} from '../../common/utils/db-helpers'
import { Prisma } from '@prisma/client'
import { FindAllInfiniteListVariantDto } from './dto/findAllInfiniteList-variant.dto'

@Injectable()
export class VariantsService {
  constructor(private db: DbService) {}

  private async getVariant(id: string) {
    const variant = await this.db.variant.findUnique({
      where: {
        id,
      },
    })

    if (!variant) {
      throw new NotFoundException('Вариант не найден.')
    }

    return variant
  }

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

  async create(productId: string, createVariantDto: CreateVariantDto) {
    await this.db.variant.create({
      data: {
        ...createVariantDto,
        totalReceivedQuantity: 0,
        totalWarehouseQuantity: 0,
        productId,
      },
    })
  }

  async findAll({
    page,
    rowsPerPage,
    isArchived,
    orderBy,
    query,
    productIds,
  }: FindAllVariantDto) {
    const { skip, take } = getPaginationData({ page, rowsPerPage })

    const where: Prisma.VariantWhereInput = {
      isArchived: checkIsArchived(isArchived),
      OR: buildContainsArray({ fields: ['size'], query }),
      productId:
        productIds && productIds.length >= 1
          ? {
              in: productIds,
            }
          : undefined,
    }

    const [items, totalItems] = await Promise.all([
      this.db.variant.findMany({
        where,
        take,
        skip,
        orderBy: buildOrderByArray({ orderBy }),
      }),
      this.db.variant.count({
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

  async findAllInfiniteList(
    productId: string,
    { cursor, query }: FindAllInfiniteListVariantDto,
  ) {
    const limit = 10

    const where: Prisma.VariantWhereInput = {
      OR: buildContainsArray({
        fields: ['size'],
        query,
      }),
      isArchived: false,
      productId,
    }

    const items = await this.db.variant.findMany({
      take: limit + 1,
      where,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        warehouseStockEntries: true,
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

  async findAllInfiniteListForWarehouse({
    warehouseId,
    query,
    cursor,
  }: {
    warehouseId: string
    query?: string
    cursor?: string
  }) {
    await this.getWarehouse(warehouseId)
    const limit = 10

    const where: Prisma.VariantWhereInput = {
      OR: query
        ? [
            {
              size: {
                contains: query,
              },
            },
            {
              barcode: {
                contains: query,
              },
            },
            {
              product: {
                title: {
                  contains: query,
                },
              },
            },
            {
              product: {
                sku: {
                  contains: query,
                },
              },
            },
          ]
        : undefined,
      warehouseStockEntries: {
        some: {
          warehouseId,
        },
      },
    }

    const items = await this.db.variant.findMany({
      take: limit + 1,
      where,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        warehouseStockEntries: {
          where: {
            warehouseId,
          },
        },
        product: {
          select: {
            title: true,
          },
        },
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
    const variant = await this.getVariant(id)

    return variant
  }

  async update(
    productId: string,
    id: string,
    updateVariantDto: UpdateVariantDto,
  ) {
    await this.getVariant(id)

    await this.db.variant.update({
      where: {
        id,
      },
      data: {
        ...updateVariantDto,
        productId,
      },
    })
  }

  async archive(id: string) {
    await this.getVariant(id)

    await this.db.variant.update({
      where: {
        id,
      },
      data: {
        isArchived: true,
      },
    })
  }

  async restore(id: string) {
    await this.getVariant(id)

    await this.db.variant.update({
      where: {
        id,
      },
      data: {
        isArchived: false,
      },
    })
  }
}
