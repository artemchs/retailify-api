import { Injectable, NotFoundException } from '@nestjs/common'
import { CreatePointsOfSaleDto } from './dto/create-points-of-sale.dto'
import { UpdatePointsOfSaleDto } from './dto/update-points-of-sale.dto'
import { DbService } from '../../db/db.service'
import { FindAllPointsOfSaleDto } from './dto/findAll-points-of-sale.dto'
import {
  buildContainsArray,
  buildOrderByArray,
  calculateTotalPages,
  checkIsArchived,
  getPaginationData,
} from '../common/utils/db-helpers'
import { Prisma } from '@prisma/client'

@Injectable()
export class PointsOfSaleService {
  constructor(private db: DbService) {}

  private async getPos(id: string) {
    const pos = await this.db.pointOfSale.findUnique({
      where: {
        id,
      },
    })

    if (!pos) {
      throw new NotFoundException('Торговая точка не найдена.')
    }

    return pos
  }

  async create(createPointsOfSaleDto: CreatePointsOfSaleDto) {
    await this.db.pointOfSale.create({
      data: {
        ...createPointsOfSaleDto,
        cashiers: {
          connect: createPointsOfSaleDto.cashiers,
        },
        categoryGroups: createPointsOfSaleDto.categoryGroups
          ? {
              connect: createPointsOfSaleDto.categoryGroups,
            }
          : undefined,
        categories: createPointsOfSaleDto.categories
          ? {
              connect: createPointsOfSaleDto.categories,
            }
          : undefined,
        productTags: createPointsOfSaleDto.productTags
          ? {
              connect: createPointsOfSaleDto.productTags,
            }
          : undefined,
      },
    })
  }

  async findAll({
    page,
    rowsPerPage,
    categoryGroupIds,
    categoryIds,
    isArchived,
    orderBy,
    productTagIds,
    query,
    cashierIds,
  }: FindAllPointsOfSaleDto) {
    const { skip, take } = getPaginationData({ page, rowsPerPage })

    const where: Prisma.PointOfSaleWhereInput = {
      OR: buildContainsArray({ fields: ['name', 'address'], query }),
      isArchived: checkIsArchived(isArchived),
      productTags: productTagIds
        ? {
            some: {
              id: {
                in: productTagIds,
              },
            },
          }
        : undefined,
      cashiers: cashierIds
        ? {
            some: {
              id: {
                in: cashierIds,
              },
            },
          }
        : undefined,
      categoryGroups: categoryGroupIds
        ? {
            some: {
              id: {
                in: categoryGroupIds,
              },
            },
          }
        : undefined,
      categories: categoryIds
        ? {
            some: {
              id: {
                in: categoryIds,
              },
            },
          }
        : undefined,
    }

    const [items, totalItems] = await Promise.all([
      this.db.pointOfSale.findMany({
        where,
        take,
        skip,
        orderBy: buildOrderByArray({ orderBy }),
      }),
      this.db.pointOfSale.count({
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

  async findOne(id: string) {
    const pos = await this.getPos(id)

    return pos
  }

  async update(id: string, updatePointsOfSaleDto: UpdatePointsOfSaleDto) {
    await this.getPos(id)

    await this.db.pointOfSale.update({
      where: {
        id,
      },
      data: {
        ...updatePointsOfSaleDto,
        cashiers: updatePointsOfSaleDto.cashiers
          ? {
              set: updatePointsOfSaleDto.cashiers,
            }
          : undefined,
        productTags: updatePointsOfSaleDto.productTags
          ? {
              set: updatePointsOfSaleDto.productTags,
            }
          : undefined,
        categories: updatePointsOfSaleDto.categories
          ? {
              set: updatePointsOfSaleDto.categories,
            }
          : undefined,
        categoryGroups: updatePointsOfSaleDto.categoryGroups
          ? {
              set: updatePointsOfSaleDto.categoryGroups,
            }
          : undefined,
      },
    })
  }

  async archive(id: string) {
    await this.getPos(id)

    await this.db.pointOfSale.update({
      where: {
        id,
      },
      data: {
        isArchived: true,
      },
    })
  }

  async restore(id: string) {
    await this.getPos(id)

    await this.db.pointOfSale.update({
      where: {
        id,
      },
      data: {
        isArchived: false,
      },
    })
  }
}
