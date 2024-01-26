import { Injectable, NotFoundException } from '@nestjs/common'
import {
  CreateProductDto,
  ProductCharacteristicValuesDto,
  ProductColorDto,
  ProductMediaDto,
} from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { DbService } from '../../db/db.service'
import { StorageService } from '../../storage/storage.service'
import { FindAllProductDto } from './dto/findAll-product.dto'
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
export class ProductsService {
  constructor(
    private db: DbService,
    private storage: StorageService,
  ) {}

  private async getProduct(id: string) {
    const product = await this.db.product.findUnique({
      where: {
        id,
      },
    })

    if (!product) {
      throw new NotFoundException('Товар не найден.')
    }

    return product
  }

  private async getFullProduct(id: string) {
    const product = await this.db.product.findUnique({
      where: {
        id,
      },
      include: {
        colors: true,
        media: true,
        characteristics: true,
      },
    })

    if (!product) {
      throw new NotFoundException('Товар не найден.')
    }

    return product
  }

  async create(createProductDto: CreateProductDto) {
    await Promise.all([
      this.db.product.create({
        data: {
          ...createProductDto,
          colors: {
            createMany: {
              data: createProductDto.colors,
            },
          },
          media: {
            createMany: {
              data: createProductDto.media,
            },
          },
          characteristics: {
            connect: createProductDto.characteristics?.map(({ id }) => ({
              id,
            })),
          },
        },
      }),
      this.db.collection.update({
        where: {
          id: createProductDto.collectionId,
        },
        data: {
          numOfProducts: {
            increment: 1,
          },
        },
      }),
    ])
  }

  async findAll({
    page,
    rowsPerPage,
    isArchived,
    orderBy,
    query,
  }: FindAllProductDto) {
    const { skip, take } = getPaginationData({ page, rowsPerPage })

    const where: Prisma.ProductWhereInput = {
      isArchived: checkIsArchived(isArchived),
      OR: buildContainsArray({ fields: ['title'], query }),
    }

    const [items, totalItems] = await Promise.all([
      this.db.product.findMany({
        where,
        take,
        skip,
        orderBy: buildOrderByArray({ orderBy }),
      }),
      this.db.product.count({
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
    const product = await this.getProduct(id)

    return product
  }

  private async updateProductMedia(
    productId: string,
    oldMedia: ProductMediaDto[],
    newMedia?: ProductMediaDto[],
  ) {
    if (newMedia) {
      const { deleted, updated, newItems } = compareArrays(
        oldMedia,
        newMedia,
        'id',
        'index',
      )

      return Promise.all([
        this.db.product.update({
          where: {
            id: productId,
          },
          data: {
            media: {
              updateMany: updated.map(({ index, id: mediaId }) => ({
                data: {
                  index,
                },
                where: {
                  id: mediaId,
                  productId,
                },
              })),
              deleteMany: deleted,
              createMany: {
                data: newItems.map(({ id: mediaId, index }) => ({
                  id: mediaId,
                  index,
                })),
              },
            },
          },
        }),
        this.storage.deleteFiles(deleted.map(({ id }) => id)),
      ])
    }
  }

  private async updateProductColors(
    productId: string,
    oldColors: ProductColorDto[],
    newColors?: ProductColorDto[],
  ) {
    if (newColors) {
      const { deleted, updated, newItems } = compareArrays(
        oldColors,
        newColors,
        'colorId',
        'index',
      )

      return this.db.product.update({
        where: {
          id: productId,
        },
        data: {
          colors: {
            updateMany: updated.map(({ colorId, index }) => ({
              data: {
                index,
              },
              where: {
                colorId,
                productId,
              },
            })),
            deleteMany: deleted,
            createMany: {
              data: newItems.map(({ colorId, index }) => ({ colorId, index })),
            },
          },
        },
      })
    }
  }

  private async updateProductCharacteristicValues(
    productId: string,
    oldIds: ProductCharacteristicValuesDto[],
    newIds?: ProductCharacteristicValuesDto[],
  ) {
    if (newIds) {
      const { deleted, newItems } = compareArrays(oldIds, newIds, 'id')

      return this.db.product.update({
        where: {
          id: productId,
        },
        data: {
          characteristics: {
            disconnect: deleted,
            connect: newItems.map(({ id }) => ({
              id,
            })),
          },
        },
      })
    }
  }

  private async updateProductCollection(
    oldCollectionId: string | null,
    newCollectionId?: string,
  ) {
    if (
      oldCollectionId &&
      newCollectionId &&
      oldCollectionId !== newCollectionId
    ) {
      await Promise.all([
        this.db.collection.update({
          where: {
            id: oldCollectionId,
          },
          data: {
            numOfProducts: {
              decrement: 1,
            },
          },
        }),
        this.db.collection.update({
          where: {
            id: newCollectionId,
          },
          data: {
            numOfProducts: {
              increment: 1,
            },
          },
        }),
      ])
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.getFullProduct(id)

    await Promise.all([
      this.db.product.update({
        where: {
          id,
        },
        data: {
          ...updateProductDto,
          colors: undefined,
          media: undefined,
          characteristics: undefined,
        },
      }),
      this.updateProductMedia(id, product.media, updateProductDto.media),
      this.updateProductColors(id, product.colors, updateProductDto.colors),
      this.updateProductCharacteristicValues(
        id,
        product.characteristics,
        updateProductDto.characteristics,
      ),
      this.updateProductCollection(
        product.collectionId,
        updateProductDto.collectionId,
      ),
    ])
  }

  async archive(id: string) {
    await this.getProduct(id)

    await this.db.product.update({
      where: {
        id,
      },
      data: {
        isArchived: true,
        collection: {
          update: {
            numOfProducts: {
              decrement: 1,
            },
          },
        },
      },
    })
  }

  async restore(id: string) {
    await this.getProduct(id)

    await this.db.product.update({
      where: {
        id,
      },
      data: {
        isArchived: false,
        collection: {
          update: {
            numOfProducts: {
              increment: 1,
            },
          },
        },
      },
    })
  }
}
