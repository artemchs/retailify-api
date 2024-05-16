import { Injectable, NotFoundException } from '@nestjs/common'
import {
  CreateGoodsReceiptDto,
  GoodsReceiptVariant,
} from './dto/create-goods-receipt.dto'
import { UpdateGoodsReceiptDto } from './dto/update-goods-receipt.dto'
import { DbService } from '../../db/db.service'
import { FindAllGoodsReceiptDto } from './dto/findAll-goods-receipt.dto'
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
export class GoodsReceiptsService {
  constructor(private db: DbService) {}

  private async getFullGoodsReceipt(id: string) {
    const goodsReceipt = await this.db.goodsReceipt.findUnique({
      where: {
        id,
      },
      include: {
        supplierInvoice: true,
        productVariants: {
          include: {
            variant: true,
          },
        },
      },
    })

    if (!goodsReceipt) {
      throw new NotFoundException('Накладная прихода не найдена.')
    }

    return goodsReceipt
  }

  private async getGoodsReceipt(id: string) {
    const goodsReceipt = await this.db.goodsReceipt.findUnique({
      where: {
        id,
      },
      include: {
        supplierInvoice: {
          select: {
            accountsPayable: true,
            paymentOption: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
        productVariants: {
          select: {
            variant: {
              select: {
                id: true,
                product: {
                  select: {
                    id: true,
                    title: true,
                    sku: true,
                    media: {
                      select: {
                        id: true,
                      },
                      orderBy: {
                        index: 'asc',
                      },
                    },
                  },
                },
                size: true,
                price: true,
              },
            },
            receivedQuantity: true,
            supplierPrice: true,
          },
        },
      },
    })

    if (!goodsReceipt) {
      throw new NotFoundException('Накладная прихода не найдена.')
    }

    return goodsReceipt
  }

  private async checkIfSupplierExists(id?: string) {
    if (id) {
      const supplier = await this.db.supplier.findUnique({
        where: {
          id,
        },
      })

      if (!supplier) {
        throw new NotFoundException('Поставщик не найден.')
      }

      return supplier
    }
  }

  private async checkIfWarehouseExists(id?: string) {
    if (id) {
      const warehouse = await this.db.warehouse.findUnique({
        where: {
          id,
        },
      })

      if (!warehouse) {
        throw new NotFoundException('Склад не найден.')
      }

      return warehouse
    }
  }

  private async incrementQuantity(
    variants: GoodsReceiptVariant[],
    warehouseId: string,
  ) {
    if (variants.length >= 1) {
      const variantUpdatePromises = variants.map(
        ({ variantId, receivedQuantity }) =>
          this.db.variant.update({
            where: {
              id: variantId,
            },
            data: {
              totalReceivedQuantity: {
                increment: receivedQuantity,
              },
              totalWarehouseQuantity: {
                increment: receivedQuantity,
              },
              product: {
                update: {
                  totalReceivedQuantity: {
                    increment: receivedQuantity,
                  },
                  totalWarehouseQuantity: {
                    increment: receivedQuantity,
                  },
                },
              },
            },
          }),
      )

      const vtwUpdatePromises = variants.map(
        ({ variantId, receivedQuantity }) =>
          this.db.variantToWarehouse.updateMany({
            where: {
              variantId,
              warehouseId,
            },
            data: {
              warehouseQuantity: {
                increment: receivedQuantity,
              },
            },
          }),
      )

      await Promise.all([...variantUpdatePromises, ...vtwUpdatePromises])
    }
  }

  private async updateQuantities(
    goodsReceiptId: string,
    warehouseId: string,
    variants: GoodsReceiptVariant[],
  ) {
    const goodsReceiptVariants = await this.db.variantToGoodsReceipt.findMany({
      where: {
        goodsReceiptId,
        variantId: {
          in: variants.map(({ variantId }) => variantId),
        },
      },
    })

    const receivedQuantityDiff = goodsReceiptVariants.map(
      ({ variantId, receivedQuantity }) => ({
        variantId,
        difference:
          (variants.find(({ variantId: vId }) => vId === variantId)
            ?.receivedQuantity ?? 0) - receivedQuantity,
        receivedQuantity,
      }),
    )

    const vtwUpdatePromises = receivedQuantityDiff.map(
      ({ variantId, difference }) =>
        variantId
          ? this.db.variantToWarehouse.updateMany({
              where: {
                variantId,
                warehouseId,
              },
              data: {
                warehouseQuantity: {
                  increment: difference,
                },
              },
            })
          : undefined,
    )

    const variantUpdatePromises = receivedQuantityDiff.map(
      ({ variantId, difference }) =>
        variantId
          ? this.db.variant.update({
              where: {
                id: variantId,
              },
              data: {
                totalReceivedQuantity: {
                  increment: difference,
                },
                totalWarehouseQuantity: {
                  increment: difference,
                },
                product: {
                  update: {
                    totalReceivedQuantity: {
                      increment: difference,
                    },
                    totalWarehouseQuantity: {
                      increment: difference,
                    },
                  },
                },
              },
            })
          : undefined,
    )

    await Promise.all([...variantUpdatePromises, ...vtwUpdatePromises])
  }

  private async getVtwsToCreate(
    warehouseId: string,
    variants: GoodsReceiptVariant[],
  ) {
    const existingVtwIds = (
      await this.db.variantToWarehouse.findMany({
        where: {
          variantId: {
            in: variants.map(({ variantId }) => variantId),
          },
          warehouseId,
        },
        select: {
          variantId: true,
        },
      })
    ).map(({ variantId }) => variantId)

    const vtwsToCreate = variants.filter(
      ({ variantId }) => !existingVtwIds.includes(variantId),
    )

    return vtwsToCreate
  }

  private async getGoodsReceiptVariants(goodsReceiptId: string) {
    const variants = await this.db.variantToGoodsReceipt.findMany({
      where: {
        goodsReceiptId,
      },
      select: {
        variantId: true,
        receivedQuantity: true,
        supplierPrice: true,
      },
    })

    return variants
  }

  private async updateVariantSellingPrices(variants?: GoodsReceiptVariant[]) {
    if (variants) {
      const variantsToUpdate = variants.filter((obj) => !!obj.sellingPrice)

      await this.db.$transaction(
        async (tx) =>
          await Promise.all(
            variantsToUpdate.map(({ variantId, sellingPrice }) =>
              tx.variant.update({
                where: {
                  id: variantId,
                },
                data: {
                  price: sellingPrice,
                },
              }),
            ),
          ),
      )
    }
  }

  private async updateSupplierTotalOutstandingBalance(
    totalAmount: number,
    amountPaid: number,
    supplierId: string,
  ) {
    await this.db.supplier.update({
      where: {
        id: supplierId,
      },
      data: {
        totalOutstandingBalance: {
          increment: totalAmount - amountPaid,
        },
      },
    })
  }

  async create(createGoodsReceiptDto: CreateGoodsReceiptDto) {
    const [goodsReceiptsCount] = await Promise.all([
      this.db.goodsReceipt.count(),
      this.checkIfSupplierExists(createGoodsReceiptDto.supplierId),
      this.checkIfWarehouseExists(createGoodsReceiptDto.warehouseId),
    ])

    const vtwsToCreate = await this.getVtwsToCreate(
      createGoodsReceiptDto.warehouseId,
      createGoodsReceiptDto.variants,
    )

    const totalAmount =
      createGoodsReceiptDto.variants.length > 0
        ? createGoodsReceiptDto.variants
            .map(
              ({ receivedQuantity, supplierPrice }) =>
                receivedQuantity * supplierPrice,
            )
            .reduce((prev, curr) => prev + curr, 0)
        : 0

    await this.db.$transaction([
      this.db.goodsReceipt.create({
        data: {
          name: `Приход #${goodsReceiptsCount + 1}`,
          supplierId: createGoodsReceiptDto.supplierId,
          warehouseId: createGoodsReceiptDto.warehouseId,
          goodsReceiptDate: createGoodsReceiptDto.goodsReceiptDate,
          supplierInvoice: {
            create: {
              paymentOption: createGoodsReceiptDto.paymentOption,
              accountsPayable: createGoodsReceiptDto.variants
                .map(
                  ({ receivedQuantity, supplierPrice }) =>
                    receivedQuantity * supplierPrice,
                )
                .reduce((accumulator, current) => accumulator + current, 0),
              amountPaid: createGoodsReceiptDto.amountPaid,
              outstandingBalance:
                totalAmount - createGoodsReceiptDto.amountPaid,
            },
          },
          productVariants: {
            createMany: {
              data: createGoodsReceiptDto.variants.map(
                ({ receivedQuantity, supplierPrice, variantId }) => ({
                  receivedQuantity,
                  supplierPrice,
                  variantId,
                }),
              ),
            },
          },
        },
      }),
      this.db.variantToWarehouse.createMany({
        data: vtwsToCreate.map(({ variantId }) => ({
          variantId,
          warehouseId: createGoodsReceiptDto.warehouseId,
          warehouseQuantity: 0,
        })),
      }),
    ])

    await Promise.all([
      this.updateVariantSellingPrices(createGoodsReceiptDto.variants),
      this.incrementQuantity(
        createGoodsReceiptDto.variants,
        createGoodsReceiptDto.warehouseId,
      ),
      this.updateSupplierTotalOutstandingBalance(
        totalAmount,
        createGoodsReceiptDto.amountPaid,
        createGoodsReceiptDto.supplierId,
      ),
    ])
  }

  async findAll({
    page,
    rowsPerPage,
    orderBy,
    query,
    goodsReceiptDate,
    isArchived,
    paymentOptions,
    supplierIds,
    warehouseIds,
  }: FindAllGoodsReceiptDto) {
    const { skip, take } = getPaginationData({ page, rowsPerPage })

    const where: Prisma.GoodsReceiptWhereInput = {
      OR: buildContainsArray({ fields: ['name'], query }),
      isArchived: checkIsArchived(isArchived),
      goodsReceiptDate: goodsReceiptDate
        ? {
            gte: goodsReceiptDate.from ? goodsReceiptDate.from : undefined,
            lte: goodsReceiptDate.to ? goodsReceiptDate.to : undefined,
          }
        : undefined,
      supplierInvoice: {
        paymentOption: paymentOptions
          ? {
              in: paymentOptions,
            }
          : undefined,
      },
      supplierId: supplierIds
        ? {
            in: supplierIds,
          }
        : undefined,
      warehouseId: warehouseIds
        ? {
            in: warehouseIds,
          }
        : undefined,
    }

    const [items, totalItems] = await Promise.all([
      this.db.goodsReceipt.findMany({
        where,
        take,
        skip,
        orderBy: buildOrderByArray({ orderBy }),
        include: {
          supplierInvoice: {
            select: {
              accountsPayable: true,
              paymentOption: true,
            },
          },
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
          warehouse: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.db.goodsReceipt.count({
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
    const goodsReceipt = await this.getGoodsReceipt(id)

    return goodsReceipt
  }

  async update(id: string, updateGoodsReceiptDto: UpdateGoodsReceiptDto) {
    const [goodsReceipt] = await Promise.all([
      this.getFullGoodsReceipt(id),
      this.checkIfSupplierExists(updateGoodsReceiptDto.supplierId),
      this.checkIfWarehouseExists(updateGoodsReceiptDto.warehouseId),
    ])

    const oldWarehouseId = goodsReceipt.warehouseId
    const newWarehouseId = updateGoodsReceiptDto.warehouseId

    const goodsReceiptVariants = await this.getGoodsReceiptVariants(id)

    const oldTotalAmount = goodsReceipt.productVariants
      .map(
        ({ receivedQuantity, supplierPrice }) =>
          receivedQuantity * Number(supplierPrice),
      )
      .reduce((prev, curr) => prev + curr, 0)

    const oldAmountPaid = Number(goodsReceipt.supplierInvoice?.amountPaid) ?? 0

    const totalAmount =
      updateGoodsReceiptDto.variants &&
      updateGoodsReceiptDto.variants.length > 0
        ? updateGoodsReceiptDto.variants
            .map(
              ({ receivedQuantity, supplierPrice }) =>
                receivedQuantity * supplierPrice,
            )
            .reduce((prev, curr) => prev + curr, 0)
        : 0

    const arraysDif = updateGoodsReceiptDto.variants
      ? compareArrays(
          goodsReceiptVariants as unknown as GoodsReceiptVariant[],
          updateGoodsReceiptDto.variants,
          'variantId',
          'receivedQuantity',
          'supplierPrice',
        )
      : undefined

    const vtwsToCreate = arraysDif?.newItems
      ? await this.getVtwsToCreate(
          (newWarehouseId ?? oldWarehouseId) as string,
          arraysDif?.newItems,
        )
      : []

    if (arraysDif?.deleted) {
      await this.incrementQuantity(
        arraysDif?.deleted.map((obj) => ({
          ...obj,
          receivedQuantity: obj.receivedQuantity * -1,
        })),
        (newWarehouseId ?? oldWarehouseId) as string,
      )
    }

    if (arraysDif?.updated) {
      await this.updateQuantities(
        id,
        (newWarehouseId ?? oldWarehouseId) as string,
        arraysDif.updated,
      )
    }

    if (arraysDif?.updated && arraysDif.updated.length >= 1) {
      const promises = arraysDif.updated.map(
        ({ receivedQuantity, supplierPrice, variantId }) =>
          this.db.variantToGoodsReceipt.updateMany({
            where: {
              variantId,
              goodsReceiptId: id,
            },
            data: {
              receivedQuantity,
              supplierPrice,
            },
          }),
      )

      await Promise.all(promises)
    }

    await this.db.$transaction([
      this.db.goodsReceipt.update({
        data: {
          supplierId: updateGoodsReceiptDto.supplierId,
          warehouseId: updateGoodsReceiptDto.warehouseId,
          goodsReceiptDate: updateGoodsReceiptDto.goodsReceiptDate,
          supplierInvoice: {
            update: {
              paymentOption: updateGoodsReceiptDto.paymentOption,
              accountsPayable: updateGoodsReceiptDto.variants
                ?.map(
                  ({ receivedQuantity, supplierPrice }) =>
                    receivedQuantity * supplierPrice,
                )
                .reduce((accumulator, current) => accumulator + current, 0),
              amountPaid: updateGoodsReceiptDto.amountPaid,
              outstandingBalance: updateGoodsReceiptDto.amountPaid
                ? totalAmount - updateGoodsReceiptDto.amountPaid
                : 0,
            },
          },
          productVariants: {
            deleteMany: arraysDif?.deleted,
            createMany:
              arraysDif?.newItems && arraysDif.newItems.length >= 1
                ? {
                    data: arraysDif.newItems,
                  }
                : undefined,
          },
        },
        where: {
          id,
        },
      }),
      this.db.variantToWarehouse.createMany({
        data: vtwsToCreate?.map(({ variantId, receivedQuantity }) => ({
          variantId,
          warehouseId: newWarehouseId ?? oldWarehouseId,
          warehouseQuantity: receivedQuantity,
        })),
      }),
    ])

    await this.updateVariantSellingPrices(updateGoodsReceiptDto.variants)

    // New supplier
    if (updateGoodsReceiptDto.supplierId !== goodsReceipt.supplierId) {
      if (goodsReceipt.supplierId) {
        await this.db.supplier.update({
          where: {
            id: goodsReceipt.supplierId,
          },
          data: {
            totalOutstandingBalance: {
              decrement: oldTotalAmount - oldAmountPaid,
            },
          },
        })
      }

      await this.db.supplier.update({
        where: {
          id: updateGoodsReceiptDto.supplierId,
        },
        data: {
          totalOutstandingBalance: {
            increment: oldTotalAmount - oldAmountPaid,
          },
        },
      })
    }

    // New total amount
    if (
      totalAmount &&
      (totalAmount !== oldTotalAmount ||
        updateGoodsReceiptDto.amountPaid !== oldAmountPaid) &&
      (updateGoodsReceiptDto.supplierId || goodsReceipt.supplierId)
    ) {
      await this.db.supplier.update({
        where: {
          id:
            updateGoodsReceiptDto.supplierId ??
            goodsReceipt.supplierId ??
            undefined,
        },
        data: {
          totalOutstandingBalance: {
            increment:
              totalAmount -
              (updateGoodsReceiptDto.amountPaid ?? 0) -
              (oldTotalAmount - oldAmountPaid),
          },
        },
      })
    }
  }

  private async updateVariantQuantities(
    action: 'increment' | 'decrement',
    variants: { variantId: string | null; receivedQuantity: number }[],
  ) {
    await Promise.all(
      variants.map(({ variantId, receivedQuantity }) =>
        variantId
          ? this.db.variant.update({
              where: {
                id: variantId,
              },
              data: {
                totalReceivedQuantity: {
                  [action]: receivedQuantity,
                },
                totalWarehouseQuantity: {
                  [action]: receivedQuantity,
                },
                warehouseStockEntries: {
                  updateMany: {
                    where: {
                      variantId,
                    },
                    data: {
                      warehouseQuantity: {
                        [action]: receivedQuantity,
                      },
                    },
                  },
                },
                product: {
                  update: {
                    totalReceivedQuantity: {
                      [action]: receivedQuantity,
                    },
                    totalWarehouseQuantity: {
                      [action]: receivedQuantity,
                    },
                  },
                },
              },
            })
          : undefined,
      ),
    )
  }

  async archive(id: string) {
    const goodsReceipt = await this.getFullGoodsReceipt(id)

    if (!goodsReceipt.isArchived) {
      await Promise.all([
        this.updateVariantQuantities('decrement', goodsReceipt.productVariants),
        this.db.supplier.update({
          where: {
            id: goodsReceipt.supplierId ?? undefined,
          },
          data: {
            totalOutstandingBalance: {
              decrement: goodsReceipt.supplierInvoice?.outstandingBalance,
            },
          },
        }),
        this.db.goodsReceipt.update({
          where: {
            id,
          },
          data: {
            isArchived: true,
          },
        }),
      ])
    }
  }

  async restore(id: string) {
    const goodsReceipt = await this.getFullGoodsReceipt(id)

    if (goodsReceipt.isArchived) {
      await Promise.all([
        this.updateVariantQuantities('increment', goodsReceipt.productVariants),
        this.db.supplier.update({
          where: {
            id: goodsReceipt.supplierId ?? undefined,
          },
          data: {
            totalOutstandingBalance: {
              increment: goodsReceipt.supplierInvoice?.outstandingBalance,
            },
          },
        }),
        this.db.goodsReceipt.update({
          where: {
            id,
          },
          data: {
            isArchived: false,
          },
        }),
      ])
    }
  }
}
