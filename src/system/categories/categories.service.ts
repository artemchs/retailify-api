import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'
import { DbService } from '../../db/db.service'
import {
  FindAllCategoryDto,
  FindAllInfiniteListCategoryDto,
} from './dto/findAll-category.dto'
import {
  buildContainsArray,
  buildOrderByArray,
  calculateTotalPages,
  checkIsArchived,
  getPaginationData,
} from '../common/utils/db-helpers'
import { Prisma } from '@prisma/client'
import { DEFAULT_PRISMA_LIMIT } from '../common/constants'

@Injectable()
export class CategoriesService {
  constructor(private db: DbService) {}

  private async getCategory(id: string) {
    const category = await this.db.category.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            products: {
              where: {
                isArchived: false,
              },
            },
          },
        },
      },
    })

    if (!category) {
      throw new NotFoundException('Категория не найдена.')
    }

    return category
  }

  private async getCategoryGroup(id: string) {
    const categoryGroup = await this.db.categoryGroup.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            categories: true,
          },
        },
      },
    })

    if (!categoryGroup) {
      throw new NotFoundException('Группа категорий не найдена.')
    }

    return categoryGroup
  }

  private async checkIfCharacteristicsAreUsedInGroup(
    groupId: string,
    characteristicIds: string[],
  ) {
    const characteristics = await this.db.characteristic.findMany({
      where: {
        categoryGroups: {
          some: {
            id: groupId,
          },
        },
        id: {
          in: characteristicIds,
        },
      },
      select: {
        name: true,
      },
    })

    if (characteristics.length >= 1) {
      throw new BadRequestException(
        `Характеристики: "${characteristics
          .map(({ name }) => name)
          .join(', ')}" уже используються в родительской группе категорий.`,
      )
    }
  }

  async create(createCategoryDto: CreateCategoryDto) {
    await this.getCategoryGroup(createCategoryDto.groupId)
    if (
      createCategoryDto.characteristics &&
      createCategoryDto.characteristics.length >= 1
    ) {
      await this.checkIfCharacteristicsAreUsedInGroup(
        createCategoryDto.groupId,
        createCategoryDto.characteristics?.map(({ id }) => id),
      )
    }

    return await this.db.category.create({
      data: {
        name: createCategoryDto.name,
        productName: createCategoryDto.productName,
        groupId: createCategoryDto.groupId,
        characteristics: {
          connect: createCategoryDto.characteristics,
        },
      },
    })
  }

  async findAll({
    page,
    rowsPerPage,
    orderBy,
    query,
    isArchived,
  }: FindAllCategoryDto) {
    const { skip, take } = getPaginationData({ page, rowsPerPage })

    const where: Prisma.CategoryWhereInput = {
      isArchived: checkIsArchived(isArchived),
      OR: buildContainsArray({ fields: ['name'], query }),
    }

    const [items, totalItems] = await Promise.all([
      this.db.category.findMany({
        where,
        take,
        skip,
        orderBy: buildOrderByArray({ orderBy }),
        include: {
          _count: {
            select: {
              products: {
                where: {
                  isArchived: false,
                },
              },
            },
          },
        },
      }),
      this.db.category.count({
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

  async findAllInfiniteList({ query, cursor }: FindAllInfiniteListCategoryDto) {
    const where: Prisma.CategoryWhereInput = {
      OR: buildContainsArray({ fields: ['name'], query }),
      isArchived: false,
    }

    const items = await this.db.category.findMany({
      take: DEFAULT_PRISMA_LIMIT + 10,
      where,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        name: 'asc',
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
    const category = await this.getCategory(id)

    return category
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.getCategory(id)
    if (updateCategoryDto.groupId) {
      await this.getCategoryGroup(updateCategoryDto.groupId)
    }

    if (
      updateCategoryDto.characteristics &&
      updateCategoryDto.characteristics?.length >= 1
    ) {
      const groupId = updateCategoryDto.groupId ?? category.groupId
      if (groupId) {
        await this.checkIfCharacteristicsAreUsedInGroup(
          groupId,
          updateCategoryDto.characteristics.map(({ id }) => id),
        )
      }
    }

    return await this.db.category.update({
      where: {
        id,
      },
      data: {
        name: updateCategoryDto.name,
        productName: updateCategoryDto.productName,
        groupId: updateCategoryDto.groupId,
        characteristics: {
          set: updateCategoryDto.characteristics ?? [],
        },
      },
    })
  }

  async archive(id: string) {
    await this.getCategory(id)

    await this.db.category.update({
      where: {
        id,
      },
      data: {
        isArchived: true,
      },
    })
  }

  async restore(id: string) {
    await this.getCategory(id)

    await this.db.category.update({
      where: {
        id,
      },
      data: {
        isArchived: false,
      },
    })
  }
}
