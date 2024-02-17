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
import { BatchEditProductDto } from './dto/batch-edit-product.dto'

type GenerateSkuProps = {
  brandId: string
  categoryId: string
  firstColorId: string
  season: ProductSeason
  gender: ProductGender
  oldYearCode?: string
}

@Injectable()
export class ProductsService {
  constructor(
    private db: DbService,
    private storage: StorageService,
  ) {}

  private async countProductWithSameSku(sku: string) {
    const count = await this.db.product.count({
      where: {
        sku: {
          startsWith: sku,
        },
      },
    })

    return count
  }

  private async generateSku({
    brandId,
    categoryId,
    gender,
    season,
    firstColorId,
    oldYearCode,
  }: GenerateSkuProps) {
    let seasonCode = ''
    const genderCode = gender[0].toUpperCase()
    let brandCode = ''
    let categoryCode = ''
    let firstColorCode = ''
    const yearCode =
      oldYearCode ?? new Date().getFullYear().toString().slice(-2)

    const [brand, category, color] = await Promise.all([
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
      this.db.color.findUnique({
        where: {
          id: firstColorId,
        },
        select: {
          name: true,
        },
      }),
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
      })
        .slice(0, 2)
        .padEnd(2, '_')
    }

    if (category?.name) {
      categoryCode = slugify(category.name, {
        uppercase: true,
      })
        .slice(0, 2)
        .padEnd(2, '_')
    }

    if (color?.name) {
      firstColorCode = slugify(color.name, {
        uppercase: true,
      })
        .slice(0, 2)
        .padEnd(2, '_')
    }

    const sku = `${brandCode}${categoryCode}${firstColorCode}${seasonCode}${genderCode}${yearCode}`

    const count = await this.countProductWithSameSku(sku)

    return `${sku}${count + 1}`
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
    const sku = await this.generateSku({
      brandId: createProductDto.brandId,
      categoryId: createProductDto.categoryId,
      gender: createProductDto.gender,
      season: createProductDto.season,
      firstColorId: createProductDto.colors[0].id,
    })

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
        media: createProductDto.media
          ? {
              createMany: {
                data: createProductDto.media,
              },
            }
          : undefined,
        characteristicValues: createProductDto.characteristicValues
          ? {
              connect: createProductDto.characteristicValues?.map(({ id }) => ({
                id,
              })),
            }
          : undefined,
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
      sku = await this.generateSku({
        brandId: updateProductDto.brandId ?? product.brandId,
        categoryId: updateProductDto.categoryId ?? product.categoryId,
        firstColorId:
          updateProductDto.colors?.[0].id ?? product.colors[0].colorId,
        gender: updateProductDto.gender ?? product.gender,
        season: updateProductDto.season ?? product.season,
        oldYearCode: new Date(product.createdAt)
          .getFullYear()
          .toString()
          .slice(-2),
      })
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

  async batchEdit({ products }: BatchEditProductDto) {
    await this.db.$transaction(async (tx) => {
      await Promise.all(
        products.map(async (product) => {
          if (product.colors && product.colors.length >= 1) {
            await tx.productToColor.deleteMany({
              where: {
                productId: product.id,
              },
            })

            await tx.productToColor.createMany({
              data: product.colors.map((c) => ({
                colorId: c.id,
                index: c.index,
                productId: product.id,
              })),
            })
          }

          await tx.product.update({
            where: {
              id: product.id,
            },
            data: {
              brandId: product.brandId,
              categoryId: product.categoryId,
              gender: product.gender,
              season: product.season,
              packagingHeight: product.packagingHeight,
              packagingLength: product.packagingLength,
              packagingWeight: product.packagingWeight,
              packagingWidth: product.packagingWidth,
            },
          })
        }),
      )
    })
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
