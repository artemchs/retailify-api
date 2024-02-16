import { Injectable, NotFoundException } from '@nestjs/common'
import {
  CreateProductDto,
  ProductCharacteristicValuesDto,
  ProductColorDto,
  ProductMediaDto,
} from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { DbService } from '../../db/db.service'
import { StorageService } from '../storage/storage.service'
import { FindAllProductDto } from './dto/findAll-product.dto'
import {
  buildContainsArray,
  buildOrderByArray,
  calculateTotalPages,
  checkIsArchived,
  getPaginationData,
} from '../common/utils/db-helpers'
import { Prisma, ProductGender, ProductSeason } from '@prisma/client'
import { compareArrays } from '../common/utils/compare-arrays'
import { FindAllInfiniteListProductDto } from './dto/findAllInfiniteList-product.dto'
import { slugify } from 'transliteration'

@Injectable()
export class ProductsService {
  constructor(
    private db: DbService,
    private storage: StorageService,
  ) {}

  private async generateSku(
    brandId: string,
    categoryId: string,
    season: ProductSeason,
    gender: ProductGender,
    oldYearCode?: string,
  ) {
    let seasonCode = ''
    const genderCode = gender[0].toUpperCase()
    let brandCode = ''
    let categoryCode = ''
    const yearCode =
      oldYearCode ?? new Date().getFullYear().toString().slice(-2)

    const [brand, category, uniqueField] = await Promise.all([
      this.db.brand.findUnique({
        where: {
          id: brandId,
        },
        select: {
          name: true,
        },
      }),
      this.db.category.findUnique({
        where: {
          id: categoryId,
        },
        select: {
          name: true,
        },
      }),
      (
        (await this.db.product.count({
          where: {
            AND: [
              {
                brandId,
              },
              {
                categoryId,
              },
              {
                gender,
              },
              {
                season,
              },
              {
                createdAt: {
                  gte: new Date(new Date().getFullYear()),
                  lte: new Date(new Date().getFullYear() + 1),
                },
              },
            ],
          },
        })) + 1
      ).toString(),
    ])

    if (season.split('_').length > 1) {
      const a = season.split('_')[0][0].toUpperCase()
      const b = season.split('_')[1][0].toUpperCase()
      seasonCode = a + b
    } else {
      seasonCode = season[0] + season[1]
    }

    if (brand?.name) {
      brandCode = slugify(brand?.name, {
        uppercase: true,
      }).slice(0, 2)
    }

    if (category?.name) {
      categoryCode = slugify(category.name, {
        uppercase: true,
      }).slice(0, 2)
    }

    return `${brandCode.padEnd(2, '_')}${categoryCode.padEnd(
      2,
      '_',
    )}${seasonCode}${genderCode}${yearCode}${uniqueField}`
  }

  private async getProduct(id: string) {
    const product = await this.db.product.findUnique({
      where: {
        id,
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        colors: {
          select: {
            colorId: true,
            index: true,
            color: {
              select: {
                name: true,
                color: true,
              },
            },
          },
          orderBy: {
            index: 'asc',
          },
        },
        media: {
          select: {
            id: true,
            index: true,
          },
          orderBy: {
            index: 'asc',
          },
        },
        characteristicValues: {
          select: {
            id: true,
            characteristicId: true,
          },
        },
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
        characteristicValues: true,
      },
    })

    if (!product) {
      throw new NotFoundException('Товар не найден.')
    }

    return product
  }

  async create(createProductDto: CreateProductDto) {
    const sku = await this.generateSku(
      createProductDto.brandId,
      createProductDto.categoryId,
      createProductDto.season,
      createProductDto.gender,
    )

    await this.db.product.create({
      data: {
        ...createProductDto,
        colors: {
          createMany: {
            data: createProductDto.colors.map(({ id, index }) => ({
              colorId: id,
              index,
            })),
          },
        },
        media: {
          createMany: {
            data: createProductDto.media,
          },
        },
        characteristicValues: {
          connect: createProductDto.characteristicValues?.map(({ id }) => ({
            id,
          })),
        },
        sku,
      },
    })
  }

  async findAllInfiniteList({ cursor, query }: FindAllInfiniteListProductDto) {
    const limit = 10

    const where: Prisma.ProductWhereInput = {
      OR: buildContainsArray({
        fields: ['title', 'sku'],
        query,
      }),
      isArchived: false,
    }

    const items = await this.db.product.findMany({
      take: limit + 1,
      where,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        variants: true,
        media: true,
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
      OR: buildContainsArray({ fields: ['title', 'sku'], query }),
    }

    const [items, totalItems] = await Promise.all([
      this.db.product.findMany({
        where,
        take,
        skip,
        orderBy: buildOrderByArray({ orderBy }),
        select: {
          id: true,
          sku: true,
          createdAt: true,
          updatedAt: true,
          title: true,
          gender: true,
          season: true,
          totalReceivedQuantity: true,
          totalWarehouseQuantity: true,
          packagingLength: true,
          packagingHeight: true,
          packagingWeight: true,
          packagingWidth: true,
          isArchived: true,
          brand: {
            select: {
              id: true,
              name: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          colors: {
            select: {
              colorId: true,
              index: true,
              color: {
                select: {
                  name: true,
                  color: true,
                },
              },
            },
            orderBy: {
              index: 'asc',
            },
          },
          media: {
            select: {
              id: true,
              index: true,
            },
            orderBy: {
              index: 'asc',
            },
          },
        },
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
        'id',
        'index',
      )

      return this.db.product.update({
        where: {
          id: productId,
        },
        data: {
          colors: {
            updateMany: updated.map(({ id, index }) => ({
              data: {
                index,
              },
              where: {
                colorId: id,
                productId,
              },
            })),
            deleteMany: deleted.map(({ id, index }) => ({
              colorId: id,
              index,
            })),
            createMany: {
              data: newItems.map(({ id, index }) => ({ colorId: id, index })),
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
          characteristicValues: {
            disconnect: deleted,
            connect: newItems.map(({ id }) => ({
              id,
            })),
          },
        },
      })
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.getFullProduct(id)
    let sku: string | undefined
    if (product.brandId && product.categoryId) {
      sku = await this.generateSku(
        updateProductDto.brandId ?? product.brandId,
        updateProductDto.categoryId ?? product.categoryId,
        updateProductDto.season ?? product.season,
        updateProductDto.gender ?? product.gender,
        new Date(product.createdAt).getFullYear().toString().slice(-2),
      )
    }

    await Promise.all([
      this.db.product.update({
        where: {
          id,
        },
        data: {
          ...updateProductDto,
          sku,
          colors: undefined,
          media: undefined,
          characteristicValues: undefined,
        },
      }),
      this.updateProductMedia(id, product.media, updateProductDto.media),
      this.updateProductColors(
        id,
        product.colors.map(({ colorId, index }) => ({
          id: colorId,
          index,
        })),
        updateProductDto.colors,
      ),
      this.updateProductCharacteristicValues(
        id,
        product.characteristicValues,
        updateProductDto.characteristicValues,
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
