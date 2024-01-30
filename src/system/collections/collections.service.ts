import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  CollectionDefaultCharacteristic,
  CreateCollectionDto,
} from './dto/create-collection.dto'
import { UpdateCollectionDto } from './dto/update-collection.dto'
import { DbService } from '../../db/db.service'
import { FindAllCollectionDto } from './dto/findAll-collection.dto'
import {
  buildContainsArray,
  buildOrderByArray,
  calculateTotalPages,
  checkIsArchived,
  getPaginationData,
} from '../common/utils/db-helpers'
import { Prisma } from '@prisma/client'
import { compareArrays } from '../common/utils/compare-arrays'
import { FindAllInfiniteListCollectionDto } from './dto/findAllInfiniteList-collection.dto'

@Injectable()
export class CollectionsService {
  constructor(private db: DbService) {}

  private async getFullCollection(id: string) {
    const collection = await this.db.collection.findUnique({
      where: {
        id,
      },
      include: {
        characteristics: true,
        products: true,
      },
    })

    if (!collection) {
      throw new NotFoundException('Коллекция не найдена.')
    }

    return collection
  }

  private async getCollection(id: string) {
    const collection = await this.db.collection.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            characteristics: true,
            products: true,
            children: true,
          },
        },
      },
    })

    if (!collection) {
      throw new NotFoundException('Коллекция не найдена.')
    }

    return collection
  }

  async create(createCollectionDto: CreateCollectionDto) {
    const parent = createCollectionDto.parentId
      ? await this.getCollection(createCollectionDto.parentId)
      : null

    if (parent?.parentId) {
      throw new BadRequestException(
        'Выбранная коллекция уже являеться субколлекцией.',
      )
    }

    await this.db.collection.create({
      data: {
        ...createCollectionDto,
        characteristics: {
          connect: createCollectionDto.characteristics?.map((obj) => obj),
        },
      },
    })
  }

  async findAll({
    page,
    rowsPerPage,
    isArchived,
    orderBy,
    query,
  }: FindAllCollectionDto) {
    const { skip, take } = getPaginationData({ page, rowsPerPage })

    const where: Prisma.CollectionWhereInput = {
      isArchived: checkIsArchived(isArchived),
      OR: buildContainsArray({ fields: ['name'], query }),
    }

    const [items, totalItems] = await Promise.all([
      this.db.collection.findMany({
        where: {
          ...where,
          parentId: checkIsArchived(isArchived) ? undefined : null,
        },
        take,
        skip,
        orderBy: buildOrderByArray({ orderBy }),
        include: {
          _count: {
            select: {
              characteristics: true,
              products: true,
              children: true,
            },
          },
          children: !checkIsArchived(isArchived)
            ? {
                where,
              }
            : undefined,
        },
      }),
      this.db.collection.count({
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
    parentId,
  }: FindAllInfiniteListCollectionDto) {
    const limit = 10

    const where: Prisma.CollectionWhereInput = {
      OR: buildContainsArray({ fields: ['name'], query }),
      isArchived: false,
      parentId: parentId ?? null,
    }

    const items = await this.db.collection.findMany({
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
    const collection = await this.getCollection(id)

    return collection
  }

  private async updateCollectionCharacteristics(
    collectionId: string,
    oldArray: CollectionDefaultCharacteristic[],
    newArray?: CollectionDefaultCharacteristic[],
  ) {
    if (newArray) {
      const { deleted, newItems } = compareArrays(oldArray, newArray, 'id')

      return this.db.collection.update({
        where: {
          id: collectionId,
        },
        data: {
          characteristics: {
            disconnect: deleted,
            connect: newItems,
          },
        },
      })
    }
  }

  async update(id: string, updateCollectionDto: UpdateCollectionDto) {
    const collection = await this.getFullCollection(id)

    const parent = updateCollectionDto?.parentId
      ? await this.getCollection(updateCollectionDto.parentId)
      : null

    if (parent?.parentId) {
      throw new BadRequestException(
        'Выбранная коллекция уже являеться субколлекцией.',
      )
    }

    await Promise.all([
      this.db.collection.update({
        where: {
          id,
        },
        data: {
          ...updateCollectionDto,
          characteristics: undefined,
          products: undefined,
        },
      }),
      this.updateCollectionCharacteristics(
        id,
        collection.characteristics,
        updateCollectionDto.characteristics ?? [],
      ),
    ])
  }

  async archive(id: string) {
    await this.getCollection(id)

    await this.db.collection.update({
      where: {
        id,
      },
      data: {
        isArchived: true,
        children: {
          updateMany: {
            where: {
              parentId: id,
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
    await this.getCollection(id)

    await this.db.collection.update({
      where: {
        id,
      },
      data: {
        isArchived: false,
        children: {
          updateMany: {
            where: {
              parentId: id,
            },
            data: {
              isArchived: false,
            },
          },
        },
      },
    })
  }
}
