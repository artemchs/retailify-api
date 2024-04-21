import { Injectable, NotFoundException } from '@nestjs/common'
import {
  CreateProductDto,
  ProductCharacteristicValuesDto,
  ProductColorDto,
  ProductMediaDto,
  ProductVariantDto,
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
import { Prisma } from '@prisma/client'
import { compareArrays } from '../common/utils/compare-arrays'
import { FindAllInfiniteListProductDto } from './dto/findAllInfiniteList-product.dto'
import { BatchEditProductDto } from './dto/batch-edit-product.dto'

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

  private async generateSku() {
    const productsCount = await this.db.product.count()

    return (productsCount + 1).toString().padStart(5, '0')
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
        tags: {
          select: {
            id: true,
            name: true,
          },
          orderBy: {
            name: 'asc',
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
        variants: {
          select: {
            id: true,
            size: true,
            price: true,
            sale: true,
            isArchived: true,
          },
          orderBy: {
            size: 'asc',
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

  private generateRandomNumber() {
    const min = 1 // Minimum 12-digit number is 1
    const max = 999999999999 // Maximum 12-digit number

    // Generate a random number between min and max (inclusive)
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min

    // Convert the number to a string and pad with leading zeros
    const paddedNumber = randomNumber.toString().padStart(12, '0')

    return paddedNumber
  }

  async create(createProductDto: CreateProductDto) {
    const sku = await this.generateSku()

    const characteristics = createProductDto.characteristics
    createProductDto.characteristics = undefined

    await this.db.product.create({
      data: {
        ...createProductDto,
        variants: createProductDto.variants
          ? {
              createMany: {
                data: createProductDto.variants?.map(({ price, size }) => ({
                  price,
                  size,
                  totalReceivedQuantity: 0,
                  totalWarehouseQuantity: 0,
                  isArchived: false,
                  barcode: this.generateRandomNumber(),
                })),
              },
            }
          : undefined,
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
        characteristicValues: characteristics
          ? {
              connect: characteristics
                .flatMap((obj) => obj.values)
                .map(({ id }) => ({
                  id,
                })),
            }
          : undefined,
        tags: createProductDto.tags
          ? {
              connect: createProductDto.tags,
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
          tags: {
            select: {
              id: true,
              name: true,
            },
            orderBy: {
              name: 'asc',
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
          variants: {
            select: {
              id: true,
              size: true,
              price: true,
              sale: true,
              totalReceivedQuantity: true,
              totalWarehouseQuantity: true,
              warehouseStockEntries: {
                select: {
                  warehouse: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  warehouseQuantity: true,
                },
              },
            },
            orderBy: {
              size: 'asc',
            },
            where: {
              isArchived: false,
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

  private async updateProductVariants(
    productId: string,
    oldVariants: ProductVariantDto[],
    newVariants: ProductVariantDto[],
  ) {
    if (oldVariants.length >= 1 || newVariants.length >= 1) {
      const existingVariants = oldVariants.filter((v) => v.id)

      await this.db.$transaction(async (tx) => {
        await Promise.all([
          tx.variant.createMany({
            data: newVariants.map((v) => ({
              size: v.size,
              price: v.price,
              totalReceivedQuantity: 0,
              totalWarehouseQuantity: 0,
              productId,
              barcode: this.generateRandomNumber(),
            })),
          }),
          Promise.all(
            existingVariants.map((v) =>
              tx.variant.update({
                where: {
                  id: v.id,
                  productId,
                },
                data: {
                  size: v.size,
                  price: v.price,
                },
              }),
            ),
          ),
        ])
      })
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.getFullProduct(id)

    const existingVariants: ProductVariantDto[] = []
    const newVariants: ProductVariantDto[] = []

    const characteristics = updateProductDto.characteristics
    updateProductDto.characteristics = undefined

    if (updateProductDto.variants) {
      for (const variant of updateProductDto.variants) {
        if (variant.id) {
          existingVariants.push(variant)
        } else {
          newVariants.push(variant)
        }
      }
    }

    await Promise.all([
      this.db.product.update({
        where: {
          id,
        },
        data: {
          ...updateProductDto,
          variants: undefined,
          colors: undefined,
          media: undefined,
          characteristicValues: undefined,
          tags: updateProductDto.tags
            ? {
                set: updateProductDto.tags,
              }
            : undefined,
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
        characteristics?.flatMap((obj) => obj.values),
      ),
      this.updateProductVariants(id, existingVariants, newVariants),
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
