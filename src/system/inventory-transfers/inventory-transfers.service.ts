import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  CreateInventoryTransferDto,
  InventoryTransferItemDto,
  InventoryTransferItemWithDestinationWarehouseDto,
} from './dto/create-inventory-transfer.dto'
import { UpdateInventoryTransferDto } from './dto/update-inventory-transfer.dto'
import { DbService } from '../../db/db.service'
import { FindAllInventoryTransferDto } from './dto/findAll-inventory-transfer.dto'
import {
  buildContainsArray,
  buildOrderByArray,
  calculateTotalPages,
  checkIsArchived,
  getPaginationData,
} from '../common/utils/db-helpers'
import { Prisma, PrismaClient } from '@prisma/client'
import { compareArrays } from '../common/utils/compare-arrays'
import { CreateInventoryTransferReasonDto } from './dto/create-inventory-transfer-reason.dto'
import { UpdateInventoryTransferReasonDto } from './dto/update-inventory-transfer-reason.dto'
import { DefaultArgs } from '@prisma/client/runtime/library'
import { DEFAULT_PRISMA_LIMIT } from '../common/constants'

type PrismaTx = Omit<
  PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

@Injectable()
export class InventoryTransfersService {
  constructor(private db: DbService) {}

  private async getInventoryTransfer(id: string) {
    const inventoryTransfer = await this.db.inventoryTransfer.findUnique({
      where: {
        id,
      },
    })

    if (!inventoryTransfer) {
      throw new NotFoundException('Накладная перемещение инвентаря не найдена.')
    }

    return inventoryTransfer
  }

  private async getFullInventoryTransfer(id: string) {
    const transfer = await this.getInventoryTransfer(id)

    const sourceWarehouse = await this.db.warehouse.findUnique({
      where: {
        id: transfer?.sourceWarehouseId ?? undefined,
      },
      select: {
        id: true,
      },
    })

    const inventoryTransfer = await this.db.inventoryTransfer.findUnique({
      where: {
        id,
      },
      include: {
        transferItems: {
          include: {
            variant: {
              select: {
                product: {
                  select: {
                    title: true,
                  },
                },
                size: true,
                warehouseStockEntries: sourceWarehouse
                  ? {
                      where: {
                        warehouse: {
                          id: sourceWarehouse?.id,
                        },
                      },
                      select: {
                        warehouseQuantity: true,
                      },
                      take: 1,
                    }
                  : undefined,
              },
            },
          },
        },
      },
    })

    if (!inventoryTransfer) {
      throw new NotFoundException('Накладная перемещение инвентаря не найдена.')
    }

    return inventoryTransfer
  }

  private async getWarehouse(id?: string, type?: 'source' | 'destination') {
    if (id) {
      const warehouse = await this.db.warehouse.findUnique({
        where: {
          id,
        },
      })

      if (!warehouse) {
        if (type === 'source') {
          throw new NotFoundException('Начальный склад не найден.')
        } else if (type === 'destination') {
          throw new NotFoundException('Конечный склад не найден.')
        } else {
          throw new NotFoundException('Склад не найден.')
        }
      }

      return warehouse
    }
  }

  private async getInventoryTransferReason(id?: string) {
    if (id) {
      const reason = await this.db.inventoryTransferReason.findUnique({
        where: {
          id,
        },
      })

      if (!reason) {
        throw new NotFoundException('Причина перемещения не найдена.')
      }

      return reason
    }
  }

  private async moveNewVtwsToDestinationWarehouse(
    transferItems: InventoryTransferItemDto[] | undefined,
    sourceWarehouseId: string | null,
    destinationWarehouseId: string | null,
    tx: PrismaTx,
  ) {
    if (
      sourceWarehouseId &&
      destinationWarehouseId &&
      transferItems &&
      transferItems.length >= 1
    ) {
      await Promise.all(
        transferItems.map(async ({ quantity, id }) => {
          const destinationVtw = await tx.variantToWarehouse.findFirst({
            where: {
              variantId: id,
              warehouseId: destinationWarehouseId,
            },
          })

          await tx.variantToWarehouse.updateMany({
            where: {
              variantId: id,
              warehouseId: sourceWarehouseId,
            },
            data: {
              warehouseQuantity: {
                decrement: quantity,
              },
            },
          })

          if (destinationVtw) {
            await tx.variantToWarehouse.update({
              where: {
                id: destinationVtw.id,
              },
              data: {
                warehouseQuantity: {
                  increment: quantity,
                },
              },
            })
          } else {
            await tx.variantToWarehouse.create({
              data: {
                variantId: id,
                warehouseId: destinationWarehouseId,
                warehouseQuantity: quantity,
              },
            })
          }
        }),
      )
    }
  }

  async create(createInventoryTransferDto: CreateInventoryTransferDto) {
    const [count] = await Promise.all([
      this.db.inventoryTransfer.count(),
      this.getWarehouse(createInventoryTransferDto.sourceWarehouseId, 'source'),
      this.getWarehouse(
        createInventoryTransferDto.destinationWarehouseId,
        'destination',
      ),
      this.getInventoryTransferReason(createInventoryTransferDto.reasonId),
    ])

    await this.db.$transaction(async (tx) => {
      await Promise.all([
        tx.inventoryTransfer.create({
          data: {
            ...createInventoryTransferDto,
            name: `Накладная перемещения #${count + 1}`,
            transferItems: {
              createMany: {
                data: createInventoryTransferDto.transferItems.map(
                  ({ id, quantity }) => ({
                    variantId: id,
                    quantity,
                  }),
                ),
              },
            },
          },
        }),
        this.moveNewVtwsToDestinationWarehouse(
          createInventoryTransferDto.transferItems,
          createInventoryTransferDto.sourceWarehouseId,
          createInventoryTransferDto.destinationWarehouseId,
          tx,
        ),
      ])
    })
  }

  async findAll({
    page,
    rowsPerPage,
    date,
    destinationWarehouseIds,
    isArchived,
    orderBy,
    query,
    reasonIds,
    sourceWarehouseIds,
  }: FindAllInventoryTransferDto) {
    const { skip, take } = getPaginationData({ page, rowsPerPage })

    const where: Prisma.InventoryTransferWhereInput = {
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
      destinationWarehouseId: destinationWarehouseIds
        ? {
            in: destinationWarehouseIds,
          }
        : undefined,
      sourceWarehouseId: sourceWarehouseIds
        ? {
            in: sourceWarehouseIds,
          }
        : undefined,
    }

    const [items, totalItems] = await Promise.all([
      this.db.inventoryTransfer.findMany({
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
          sourceWarehouse: {
            select: {
              id: true,
              name: true,
            },
          },
          destinationWarehouse: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.db.inventoryTransfer.count({
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
    const inventoryTransfer = await this.getFullInventoryTransfer(id)

    return inventoryTransfer
  }

  private async moveExistingVtwsToNewWarehouse(
    transferItems: InventoryTransferItemDto[] | undefined,
    oldDestinationWarehouseId: string | null,
    newDestinationWarehouseId: string | null,
    tx: PrismaTx,
  ) {
    if (
      oldDestinationWarehouseId &&
      newDestinationWarehouseId &&
      transferItems &&
      transferItems.length >= 1 &&
      oldDestinationWarehouseId !== newDestinationWarehouseId
    ) {
      await Promise.all(
        transferItems.map(async ({ quantity, id }) => {
          const oldDestinationVtw = await tx.variantToWarehouse.findFirst({
            where: {
              variantId: id,
              warehouseId: oldDestinationWarehouseId,
            },
          })

          if (oldDestinationVtw) {
            const newDestinationVtw = await tx.variantToWarehouse.findFirst({
              where: {
                variantId: id,
                warehouseId: newDestinationWarehouseId,
              },
            })

            await tx.variantToWarehouse.update({
              where: {
                id: oldDestinationVtw.id,
              },
              data: {
                warehouseQuantity: {
                  decrement: quantity,
                },
              },
            })

            if (newDestinationVtw) {
              await tx.variantToWarehouse.update({
                where: {
                  id: newDestinationVtw.id,
                },
                data: {
                  warehouseQuantity: {
                    increment: quantity,
                  },
                },
              })
            } else {
              await tx.variantToWarehouse.create({
                data: {
                  warehouseQuantity: quantity,
                  variantId: id,
                  warehouseId: newDestinationWarehouseId,
                },
              })
            }
          }
        }),
      )
    }
  }

  private async moveVtwsToSourceWarehouse(
    transferItems: InventoryTransferItemDto[] | undefined,
    oldSourceWarehouseId: string | null,
    oldDestinationWarehouseId: string | null,
    tx: PrismaTx,
  ) {
    if (
      transferItems &&
      transferItems.length >= 1 &&
      oldSourceWarehouseId &&
      oldDestinationWarehouseId
    ) {
      await Promise.all(
        transferItems.map(async ({ quantity, id }) => {
          const [oldSourceVtw, oldDestinationVtw] = await Promise.all([
            tx.variantToWarehouse.findFirst({
              where: {
                warehouseId: oldSourceWarehouseId,
                variantId: id,
              },
            }),
            tx.variantToWarehouse.findFirst({
              where: {
                warehouseId: oldDestinationWarehouseId,
                variantId: id,
              },
            }),
          ])

          if (oldSourceVtw) {
            await tx.variantToWarehouse.update({
              where: {
                id: oldSourceVtw.id,
              },
              data: {
                warehouseQuantity: {
                  increment: quantity,
                },
              },
            })
          } else {
            await tx.variantToWarehouse.create({
              data: {
                warehouseQuantity: quantity,
                variantId: id,
                warehouseId: oldSourceWarehouseId,
              },
            })
          }

          if (oldDestinationVtw) {
            await tx.variantToWarehouse.update({
              where: {
                id: oldDestinationVtw.id,
              },
              data: {
                warehouseQuantity: {
                  decrement: quantity,
                },
              },
            })
          }
        }),
      )
    }
  }

  async update(
    id: string,
    updateInventoryTransferDto: UpdateInventoryTransferDto,
  ) {
    const [inventoryTransfer] = await Promise.all([
      this.getFullInventoryTransfer(id),
      this.getWarehouse(updateInventoryTransferDto.sourceWarehouseId, 'source'),
      this.getWarehouse(
        updateInventoryTransferDto.destinationWarehouseId,
        'destination',
      ),
      this.getInventoryTransferReason(updateInventoryTransferDto.reasonId),
    ])

    const sourceWarehouseId =
      updateInventoryTransferDto.sourceWarehouseId ??
      inventoryTransfer.sourceWarehouseId

    const destinationWarehouseId =
      updateInventoryTransferDto.destinationWarehouseId ??
      inventoryTransfer.destinationWarehouseId

    const oldTransferItems = inventoryTransfer.transferItems.map(
      ({ quantity, variantId }) => ({
        quantity,
        id: variantId,
        destinationWarehouseId: inventoryTransfer.destinationWarehouseId,
      }),
    ) as InventoryTransferItemWithDestinationWarehouseDto[]

    const newTransferItems =
      updateInventoryTransferDto.transferItems?.map(({ quantity, id }) => ({
        quantity,
        id,
        destinationWarehouseId: destinationWarehouseId,
      })) ?? []

    const compareArraysRes = newTransferItems
      ? compareArrays(
          oldTransferItems,
          newTransferItems,
          'id',
          'quantity',
          'destinationWarehouseId',
        )
      : undefined

    const newItems = compareArraysRes?.newItems.map(({ quantity, id }) => ({
      quantity,
      id,
    }))

    const updatedItems = compareArraysRes?.updated.map(({ quantity, id }) => ({
      quantity,
      id,
    }))

    const removedItems = compareArraysRes?.deleted.map(({ quantity, id }) => ({
      quantity,
      id,
    }))

    await this.db.$transaction(async (tx) => {
      if (compareArraysRes?.updated) {
        await Promise.all(
          compareArraysRes.updated
            .filter(
              (obj) =>
                obj.destinationWarehouseId ===
                inventoryTransfer.destinationWarehouseId,
            )
            .map(async ({ quantity, id }) => {
              const vtw = await tx.variantToWarehouse.findFirst({
                where: {
                  warehouseId: inventoryTransfer.destinationWarehouseId,
                  variantId: id,
                },
              })

              if (vtw) {
                const quantityDiff = quantity - vtw.warehouseQuantity

                await Promise.all([
                  tx.variantToWarehouse.update({
                    where: {
                      id: vtw.id,
                    },
                    data: {
                      warehouseQuantity: {
                        increment: quantityDiff,
                      },
                    },
                  }),
                  tx.variantToWarehouse.updateMany({
                    where: {
                      variantId: id,
                      warehouseId: inventoryTransfer.sourceWarehouseId,
                    },
                    data: {
                      warehouseQuantity: {
                        decrement: quantityDiff,
                      },
                    },
                  }),
                  tx.inventoryTransferItem.updateMany({
                    where: {
                      variantId: id,
                      inventoryTransferId: inventoryTransfer.id,
                    },
                    data: {
                      quantity,
                    },
                  }),
                ])
              }
            }),
        )
      }

      await Promise.all([
        tx.inventoryTransfer.update({
          where: {
            id,
          },
          data: {
            ...updateInventoryTransferDto,
            transferItems: newItems
              ? {
                  createMany: newItems
                    ? {
                        data: newItems.map(({ id, quantity }) => ({
                          variantId: id,
                          quantity,
                        })),
                      }
                    : undefined,
                  deleteMany: removedItems
                    ? removedItems.map(({ id, quantity }) => ({
                        variantId: id,
                        quantity,
                      }))
                    : undefined,
                }
              : undefined,
          },
        }),
        // Move new items to the destination warehouse
        this.moveNewVtwsToDestinationWarehouse(
          newItems,
          sourceWarehouseId,
          destinationWarehouseId,
          tx,
        ),
        // Move existing items to new destination warehouse
        this.moveExistingVtwsToNewWarehouse(
          updatedItems,
          inventoryTransfer.destinationWarehouseId,
          updateInventoryTransferDto.destinationWarehouseId ?? null,
          tx,
        ),
        // Return removed items to the source warehouse
        this.moveVtwsToSourceWarehouse(
          removedItems,
          inventoryTransfer.sourceWarehouseId,
          inventoryTransfer.destinationWarehouseId ?? null,
          tx,
        ),
      ])
    })
  }

  async archive(id: string) {
    const inventoryTransfer = await this.getFullInventoryTransfer(id)

    const vtws = inventoryTransfer.transferItems
      .map(({ quantity, variantId }) => ({ quantity, id: variantId }))
      .filter((obj) => obj.id) as InventoryTransferItemDto[]

    await this.db.$transaction(async (tx) => {
      await Promise.all([
        this.moveVtwsToSourceWarehouse(
          vtws,
          inventoryTransfer.sourceWarehouseId,
          inventoryTransfer.destinationWarehouseId,
          tx,
        ),
        tx.inventoryTransfer.update({
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

  private async moveVtwsToDestinationWarehouse(
    transferItems: InventoryTransferItemDto[] | undefined,
    oldSourceWarehouseId: string | null,
    oldDestinationWarehouseId: string | null,
    tx: PrismaTx,
  ) {
    if (
      transferItems &&
      transferItems.length >= 1 &&
      oldSourceWarehouseId &&
      oldDestinationWarehouseId
    ) {
      await Promise.all(
        transferItems.map(async ({ quantity, id }) => {
          const [oldSourceVtw, oldDestinationVtw] = await Promise.all([
            tx.variantToWarehouse.findFirst({
              where: {
                warehouseId: oldSourceWarehouseId,
                variantId: id,
              },
            }),
            tx.variantToWarehouse.findFirst({
              where: {
                warehouseId: oldDestinationWarehouseId,
                variantId: id,
              },
            }),
          ])

          if (oldDestinationVtw) {
            await tx.variantToWarehouse.update({
              where: {
                id: oldDestinationVtw.id,
              },
              data: {
                warehouseQuantity: {
                  increment: quantity,
                },
              },
            })
          } else {
            await tx.variantToWarehouse.create({
              data: {
                warehouseQuantity: quantity,
                variantId: id,
                warehouseId: oldDestinationVtw,
              },
            })
          }

          if (oldSourceVtw) {
            await tx.variantToWarehouse.update({
              where: {
                id: oldSourceVtw.id,
              },
              data: {
                warehouseQuantity: {
                  decrement: quantity,
                },
              },
            })
          }
        }),
      )
    }
  }
  async restore(id: string) {
    const inventoryTransfer = await this.getFullInventoryTransfer(id)

    const vtws = inventoryTransfer.transferItems
      .map(({ quantity, variantId }) => ({ quantity, id: variantId }))
      .filter((obj) => obj.id) as InventoryTransferItemDto[]

    await this.db.$transaction(async (tx) => {
      await Promise.all([
        this.moveVtwsToDestinationWarehouse(
          vtws,
          inventoryTransfer.sourceWarehouseId,
          inventoryTransfer.destinationWarehouseId,
          tx,
        ),
        tx.inventoryTransfer.update({
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

  async createReason(createReasonDto: CreateInventoryTransferReasonDto) {
    await this.db.inventoryTransferReason.create({
      data: createReasonDto,
    })
  }

  async findAllReasons({ cursor, query }: { cursor?: string; query?: string }) {
    const where: Prisma.InventoryTransferReasonWhereInput = {
      OR: buildContainsArray({ fields: ['name'], query }),
    }

    const items = await this.db.inventoryTransferReason.findMany({
      take: DEFAULT_PRISMA_LIMIT + 1,
      where,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        createdAt: 'desc',
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

  async findOneReason(id: string) {
    const reason = await this.getInventoryTransferReason(id)

    return reason
  }

  async updateReason(
    id: string,
    updateReasonDto: UpdateInventoryTransferReasonDto,
  ) {
    await this.getInventoryTransferReason(id)

    await this.db.inventoryTransferReason.update({
      where: {
        id,
      },
      data: updateReasonDto,
    })
  }

  async removeReason(id: string) {
    await this.getInventoryTransferReason(id)
    const transfersCount = await this.db.inventoryTransfer.count({
      where: {
        reasonId: id,
      },
    })

    if (transfersCount >= 1) {
      throw new BadRequestException(
        `Невозможно удалить причину перемещения, так как ${transfersCount} списаний привязаны к нему.`,
      )
    }

    await this.db.inventoryTransferReason.delete({
      where: {
        id,
      },
    })
  }
}
