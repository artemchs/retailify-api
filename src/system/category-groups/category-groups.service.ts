import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CreateCategoryGroupDto } from './dto/create-category-group.dto'
import { UpdateCategoryGroupDto } from './dto/update-category-group.dto'
import { DbService } from '../../db/db.service'
import {
  FindAllCategoryGroupDto,
  FindAllInfiniteListCategoryGroupDto,
} from './dto/findAll-category-group-dto'
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
export class CategoryGroupsService {
  constructor(private db: DbService) {}

  private async getCategoryGroup(id: string) {
    const categoryGroup = await this.db.categoryGroup.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            categories: {
              where: {
                isArchived: false,
              },
            },
          },
        },
      },
    })

    if (!categoryGroup) {
      throw new NotFoundException('Группа категорий не найдена.')
    }

    return categoryGroup
  }

  private async checkIfCharacteristicsAreUsedInCategories(
    groupId: string,
    characteristicIds: string[],
  ) {
    const characteristics = await this.db.characteristic.findMany({
      where: {
        categories: {
          some: {
            groupId,
          },
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
          .join(
            ', ',
          )}" уже используються в категориях привязанных к этой группе.`,
      )
    }
  }

  async create(createCategoryGroupDto: CreateCategoryGroupDto) {
    await this.db.categoryGroup.create({
      data: {
        ...createCategoryGroupDto,
        characteristics: {
          connect: createCategoryGroupDto.characteristics,
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
  }: FindAllCategoryGroupDto) {
    const { skip, take } = getPaginationData({ page, rowsPerPage })

    const where: Prisma.CategoryGroupWhereInput = {
      isArchived: checkIsArchived(isArchived),
      OR: buildContainsArray({ fields: ['name'], query }),
    }

    const [items, totalItems] = await Promise.all([
      this.db.categoryGroup.findMany({
        where,
        take,
        skip,
        orderBy: buildOrderByArray({ orderBy }),
        include: {
          _count: {
            select: {
              categories: {
                where: {
                  isArchived: false,
                },
              },
            },
          },
        },
      }),
      this.db.categoryGroup.count({
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
    query,
    cursor,
  }: FindAllInfiniteListCategoryGroupDto) {
    const where: Prisma.CategoryGroupWhereInput = {
      OR: buildContainsArray({ fields: ['name'], query }),
      isArchived: false,
    }

    const items = await this.db.categoryGroup.findMany({
      take: DEFAULT_PRISMA_LIMIT + 1,
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
    const categoryGroup = await this.getCategoryGroup(id)

    return categoryGroup
  }

  async update(id: string, updateCategoryGroupDto: UpdateCategoryGroupDto) {
    await this.getCategoryGroup(id)
    if (
      updateCategoryGroupDto.characteristics &&
      updateCategoryGroupDto.characteristics.length >= 1
    ) {
      await this.checkIfCharacteristicsAreUsedInCategories(
        id,
        updateCategoryGroupDto.characteristics.map(({ id }) => id),
      )
    }

    await this.db.categoryGroup.update({
      where: {
        id,
      },
      data: {
        name: updateCategoryGroupDto.name,
        characteristics: {
          set: updateCategoryGroupDto.characteristics ?? [],
        },
      },
    })
  }

  async archive(id: string) {
    await this.getCategoryGroup(id)

    await this.db.categoryGroup.update({
      where: {
        id,
      },
      data: {
        isArchived: true,
        categories: {
          updateMany: {
            where: {
              groupId: id,
            },
            data: {
              isArchived: true,
            },
          },
        },
      },
    })
  }

  async restore(id: string) {
    await this.getCategoryGroup(id)

    await this.db.categoryGroup.update({
      where: {
        id,
      },
      data: {
        isArchived: false,
      },
    })
  }
}
