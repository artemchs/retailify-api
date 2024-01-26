import { Injectable, NotFoundException } from '@nestjs/common'
import {
  CollectionDefaultCharacteristic,
  CollectionProduct,
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
    })

    if (!collection) {
      throw new NotFoundException('Коллекция не найдена.')
    }

    return collection
  }

  async create(createCollectionDto: CreateCollectionDto) {
    await this.db.collection.create({
      data: {
        ...createCollectionDto,
        products: {
          connect: createCollectionDto.products?.map((obj) => obj),
        },
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
        where,
        take,
        skip,
        orderBy: buildOrderByArray({ orderBy }),
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

  private async updateCollectionProducts(
    collectionId: string,
    oldArray: CollectionProduct[],
    newArray?: CollectionProduct[],
  ) {
    if (newArray) {
      const { deleted, newItems } = compareArrays(oldArray, newArray, 'id')

      return this.db.collection.update({
        where: {
          id: collectionId,
        },
        data: {
          products: {
            disconnect: deleted,
            connect: newItems,
          },
        },
      })
    }
  }

  async update(id: string, updateCollectionDto: UpdateCollectionDto) {
    const collection = await this.getFullCollection(id)

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
        updateCollectionDto.characteristics,
      ),
      this.updateCollectionProducts(
        id,
        collection.products,
        updateCollectionDto.products,
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
      },
    })
  }
}
