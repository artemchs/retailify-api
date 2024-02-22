import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  CreateInventoryAdjustmentDto,
  InventoryAdjustmentVariant,
} from './dto/create-inventory-adjustment.dto'
import { UpdateInventoryAdjustmentDto } from './dto/update-inventory-adjustment.dto'
import { DbService } from '../../db/db.service'
import { FindAllInventoryAdjustmentDto } from './dto/findAll-inventory-adjustment.dto'
import {
  buildContainsArray,
  buildOrderByArray,
  calculateTotalPages,
  checkIsArchived,
  getPaginationData,
} from '../common/utils/db-helpers'
import { Prisma } from '@prisma/client'
import { compareArrays } from '../common/utils/compare-arrays'
import { CreateInventoryAdjustmentReasonDto } from './dto/create-inventory-adjustment-reason.dto'
import { UpdateInventoryAdjustmentReasonDto } from './dto/update-inventory-adjustment-reason.dto'

@Injectable()
export class InventoryAdjustmentsService {
  constructor(private db: DbService) {}

  private async getInventoryAdjustment(id: string) {
    const inventoryAdjustment = await this.db.inventoryAdjustment.findUnique({
      where: {
        id,
      },
    })

    if (!inventoryAdjustment) {
      throw new NotFoundException('Накладная инвентаризации не найдена.')
    }

    return inventoryAdjustment
  }

  private async getFullInventoryAdjustment(id: string) {
    const inventoryAdjustment = await this.db.inventoryAdjustment.findUnique({
      where: {
        id,
      },
      include: {
        reason: true,
        variants: true,
        warehouse: true,
      },
    })

    if (!inventoryAdjustment) {
      throw new NotFoundException('Накладная инвентаризации не найдена.')
    }

    return inventoryAdjustment
  }

  private async getWarehouse(id?: string) {
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

  private async getInventoryAdjustmentReason(id?: string) {
    if (id) {
      const reason = await this.db.inventoryAdjustmentReason.findUnique({
        where: {
          id,
        },
      })

      if (!reason) {
        throw new NotFoundException('Причина списания не найдена.')
      }

      return reason
    }
  }

  private async updateQuantity(
    variants: InventoryAdjustmentVariant[],
    action: 'increment' | 'decrement',
  ) {
    return Promise.all(
      variants.map(({ quantityChange, variantToWarehouseId }) =>
        this.db.variantToWarehouse.update({
          where: {
            id: variantToWarehouseId,
          },
          data: {
            warehouseQuantity: {
              [action]: quantityChange,
            },
            variant: {
              update: {
                totalWarehouseQuantity: {
                  [action]: quantityChange,
                },
                product: {
                  update: {
                    totalWarehouseQuantity: {
                      [action]: quantityChange,
                    },
                  },
                },
              },
            },
          },
        }),
      ),
    )
  }

  async create(createInventoryAdjustmentDto: CreateInventoryAdjustmentDto) {
    const [inventoryAdjustmentsCount] = await Promise.all([
      this.db.inventoryAdjustment.count(),
      this.getWarehouse(createInventoryAdjustmentDto.warehouseId),
      this.getInventoryAdjustmentReason(createInventoryAdjustmentDto.reasonId),
    ])

    await Promise.all([
      this.db.inventoryAdjustment.create({
        data: {
          ...createInventoryAdjustmentDto,
          name: `Инвентаризация #${inventoryAdjustmentsCount + 1}`,
          variants: {
            createMany: {
              data: createInventoryAdjustmentDto.variants.map(
                ({ variantToWarehouseId, quantityChange }) => ({
                  quantityChange,
                  variantToWarehouseId,
                }),
              ),
            },
          },
        },
      }),
      this.updateQuantity(createInventoryAdjustmentDto.variants, 'increment'),
    ])
  }

  async findAll({
    page,
    rowsPerPage,
    isArchived,
    orderBy,
    query,
    warehouseIds,
    reasonIds,
    date,
  }: FindAllInventoryAdjustmentDto) {
    const { skip, take } = getPaginationData({ page, rowsPerPage })

    const where: Prisma.InventoryAdjustmentWhereInput = {
      OR: buildContainsArray({ fields: ['name'], query }),
      isArchived: checkIsArchived(isArchived),
      date: date
        ? {
            gte: date.from ?? undefined,
            lte: date.to ?? undefined,
          }
        : undefined,
      reasonId: reasonIds
        ? {
            in: reasonIds,
          }
        : undefined,
      warehouseId: warehouseIds
        ? {
            in: warehouseIds,
          }
        : undefined,
    }

    const [items, totalItems] = await Promise.all([
      this.db.inventoryAdjustment.findMany({
        where,
        take,
        skip,
        orderBy: buildOrderByArray({ orderBy }),
        include: {
          reason: {
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
          _count: {
            select: {
              variants: true,
            },
          },
        },
      }),
      this.db.inventoryAdjustment.count({
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
    const inventoryAdjustment = await this.getInventoryAdjustment(id)

    return inventoryAdjustment
  }

  private async updateInventoryAdjustmentProductVariants(
    inventoryAdjustmentId: string,
    oldVariants: InventoryAdjustmentVariant[],
    newVariants?: InventoryAdjustmentVariant[],
  ) {
    if (newVariants) {
      const { deleted, updated, newItems } = compareArrays(
        oldVariants,
        newVariants,
        'variantToWarehouseId',
        'quantityChange',
      )

      const vtws = await this.db.variantToWarehouse.findMany({
        where: {
          inventoryAdjustments: {
            some: {
              inventoryAdjustmentId,
            },
          },
        },
        select: {
          id: true,
          inventoryAdjustments: {
            where: {
              inventoryAdjustmentId,
            },
            select: {
              quantityChange: true,
            },
          },
        },
      })

      const variants: InventoryAdjustmentVariant[] = vtws.map(
        ({ id, inventoryAdjustments }) => ({
          quantityChange: inventoryAdjustments[0].quantityChange,
          variantToWarehouseId: id,
        }),
      )

      await this.updateQuantity(variants, 'decrement')

      await this.db.inventoryAdjustment.update({
        where: {
          id: inventoryAdjustmentId,
        },
        data: {
          variants: {
            createMany: {
              data: newItems,
            },
            deleteMany: deleted,
            updateMany: updated.map(
              ({ quantityChange, variantToWarehouseId }) => ({
                data: {
                  quantityChange,
                },
                where: {
                  variantToWarehouseId,
                  inventoryAdjustmentId,
                },
              }),
            ),
          },
        },
      })

      const newVtws = await this.db.variantToWarehouse.findMany({
        where: {
          inventoryAdjustments: {
            some: {
              inventoryAdjustmentId,
            },
          },
        },
        select: {
          id: true,
          inventoryAdjustments: {
            where: {
              inventoryAdjustmentId,
            },
            select: {
              quantityChange: true,
            },
          },
        },
      })

      const newVariantsArray: InventoryAdjustmentVariant[] = newVtws.map(
        ({ id, inventoryAdjustments }) => ({
          quantityChange: inventoryAdjustments[0].quantityChange,
          variantToWarehouseId: id,
        }),
      )

      await this.updateQuantity(newVariantsArray, 'increment')
    }
  }

  async update(
    id: string,
    updateInventoryAdjustmentDto: UpdateInventoryAdjustmentDto,
  ) {
    const [inventoryAdjustment] = await Promise.all([
      this.getFullInventoryAdjustment(id),
      this.getInventoryAdjustmentReason(updateInventoryAdjustmentDto.reasonId),
      this.getWarehouse(updateInventoryAdjustmentDto.warehouseId),
    ])

    const oldVariants = inventoryAdjustment.variants.filter(
      (v) => v.variantToWarehouseId !== null,
    ) as { variantToWarehouseId: string; quantityChange: number }[]

    await Promise.all([
      this.db.inventoryAdjustment.update({
        where: {
          id,
        },
        data: {
          ...updateInventoryAdjustmentDto,
          variants: undefined,
        },
      }),
      this.updateInventoryAdjustmentProductVariants(
        id,
        oldVariants,
        updateInventoryAdjustmentDto.variants,
      ),
    ])
  }

  async archive(id: string) {
    await this.getInventoryAdjustment(id)

    await this.db.$transaction(async (tx) => {
      const vtws = await tx.variantToWarehouse.findMany({
        where: {
          inventoryAdjustments: {
            some: {
              inventoryAdjustmentId: id,
            },
          },
        },
        select: {
          id: true,
          inventoryAdjustments: {
            where: {
              inventoryAdjustmentId: id,
            },
            select: {
              quantityChange: true,
            },
          },
        },
      })

      const variants: InventoryAdjustmentVariant[] = vtws.map(
        ({ id, inventoryAdjustments }) => ({
          quantityChange: inventoryAdjustments[0].quantityChange,
          variantToWarehouseId: id,
        }),
      )

      await Promise.all([
        this.updateQuantity(variants, 'decrement'),
        tx.inventoryAdjustment.update({
          where: {
            id,
          },
          data: {
            isArchived: true,
          },
        }),
      ])
    })
  }

  async restore(id: string) {
    await this.getInventoryAdjustment(id)

    await this.db.$transaction(async (tx) => {
      const vtws = await tx.variantToWarehouse.findMany({
        where: {
          inventoryAdjustments: {
            some: {
              inventoryAdjustmentId: id,
            },
          },
        },
        select: {
          id: true,
          inventoryAdjustments: {
            where: {
              inventoryAdjustmentId: id,
            },
            select: {
              quantityChange: true,
            },
          },
        },
      })

      const variants: InventoryAdjustmentVariant[] = vtws.map(
        ({ id, inventoryAdjustments }) => ({
          quantityChange: inventoryAdjustments[0].quantityChange,
          variantToWarehouseId: id,
        }),
      )

      await Promise.all([
        this.updateQuantity(variants, 'increment'),
        this.db.inventoryAdjustment.update({
          where: {
            id,
          },
          data: {
            isArchived: false,
          },
        }),
      ])
    })
  }

  async createReason(createReasonDto: CreateInventoryAdjustmentReasonDto) {
    await this.db.inventoryAdjustmentReason.create({
      data: createReasonDto,
    })
  }

  async findAllReasons({ cursor, query }: { cursor?: string; query?: string }) {
    const limit = 10

    const where: Prisma.InventoryAdjustmentReasonWhereInput = {
      OR: buildContainsArray({ fields: ['name'], query }),
    }

    const items = await this.db.inventoryAdjustmentReason.findMany({
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

  async findOneReason(id: string) {
    const reason = await this.getInventoryAdjustmentReason(id)

    return reason
  }

  async updateReason(
    id: string,
    updateReasonDto: UpdateInventoryAdjustmentReasonDto,
  ) {
    await this.getInventoryAdjustmentReason(id)

    await this.db.inventoryAdjustmentReason.update({
      where: {
        id,
      },
      data: updateReasonDto,
    })
  }

  async removeReason(id: string) {
    await this.getInventoryAdjustmentReason(id)
    const adjustmentsCount = await this.db.inventoryAdjustment.count({
      where: {
        reasonId: id,
      },
    })

    if (adjustmentsCount >= 1) {
      throw new BadRequestException(
        `Невозможно удалить причину списания, так как ${adjustmentsCount} списаний привязаны к нему.`,
      )
    }

    await this.db.inventoryAdjustmentReason.delete({
      where: {
        id,
      },
    })
  }
}
