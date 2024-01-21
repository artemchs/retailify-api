import { Injectable, NotFoundException } from '@nestjs/common'
import {
  CreateProductDto,
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
      },
    })

    if (!product) {
      throw new NotFoundException('Товар не найден.')
    }

    return product
  }

  private compareArrays<T>(
    oldArray: T[],
    newArray: T[],
    idField: keyof T,
    optionalField?: keyof T,
  ): {
    updated: T[]
    deleted: T[]
  } {
    const updated: T[] = []
    let deleted: T[] = []

    const oldArrayMap = new Map(oldArray.map((obj) => [obj[idField], obj]))

    for (const newObj of newArray) {
      const oldObj = oldArrayMap.get(newObj[idField])

      if (oldObj) {
        if (
          oldObj[idField] !== newObj[idField] ||
          (optionalField && oldObj[optionalField] !== newObj[optionalField])
        ) {
          updated.push(newObj)
        }

        oldArrayMap.delete(newObj[idField])
      } else {
        updated.push(newObj)
      }
    }

    deleted = Array.from(oldArrayMap.values())

    return {
      updated,
      deleted,
    }
  }

  async create(createProductDto: CreateProductDto) {
    await this.db.product.create({
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
      },
    })
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
      const { deleted, updated } = this.compareArrays(
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
      const { deleted, updated } = this.compareArrays(
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
          },
        },
      })
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
        },
      }),
      this.updateProductMedia(id, product.media, updateProductDto.media),
      this.updateProductColors(id, product.colors, updateProductDto.colors),
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
      },
    })
  }
}
