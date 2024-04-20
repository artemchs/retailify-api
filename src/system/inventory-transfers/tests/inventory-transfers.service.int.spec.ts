import { DbService } from 'src/db/db.service'
import { InventoryTransfersService } from '../inventory-transfers.service'
import { Test } from '@nestjs/testing'
import { AppModule } from 'src/app.module'
import { CreateInventoryTransferReasonDto } from '../dto/create-inventory-transfer-reason.dto'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { UpdateInventoryTransferReasonDto } from '../dto/update-inventory-transfer-reason.dto'
import { CreateInventoryTransferDto } from '../dto/create-inventory-transfer.dto'
import { FindAllInventoryTransferDto } from '../dto/findAll-inventory-transfer.dto'
import { UpdateInventoryTransferDto } from '../dto/update-inventory-transfer.dto'

describe('InventoryTransfersService', () => {
  let service: InventoryTransfersService
  let db: DbService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    db = moduleRef.get(DbService)
    service = moduleRef.get(InventoryTransfersService)

    await db.reset()
  })

  afterEach(async () => await db.reset())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('reasons', () => {
    describe('createReason', () => {
      const data: CreateInventoryTransferReasonDto = {
        name: 'Test Reason 1',
      }

      it('should successfully create a new reason', async () => {
        await service.createReason(data)

        const reason = await db.inventoryTransferReason.findFirst()

        expect(reason?.name).toBe(data.name)
      })
    })

    describe('findAllReasons', () => {
      beforeEach(async () => {
        await db.inventoryTransferReason.createMany({
          data: [
            {
              name: 'Test Reason 1',
            },
            {
              name: 'Test Reason 2',
            },
            {
              name: 'Test Reason 3',
            },
          ],
        })
      })

      it('should successfully list all reasons', async () => {
        const data = await service.findAllReasons({})

        expect(data.items.length).toBe(3)
      })

      it('should filter out items by the name field', async () => {
        const data = await service.findAllReasons({ query: 'Test Reason 3' })

        expect(data.items.length).toBe(1)
        expect(data.items[0].name).toBe('Test Reason 3')
      })
    })

    describe('findOneReason', () => {
      const id = 'Test Reason 1'

      beforeEach(async () => {
        await db.inventoryTransferReason.create({
          data: {
            id,
            name: id,
          },
        })
      })

      it('should successfully find the requested reason', async () => {
        const data = await service.findOneReason(id)

        expect(data).toBeDefined()
        expect(data).not.toBeNull()
        expect(data?.id).toBe(id)
      })

      it('should fail if the reason does not exist', async () => {
        await expect(service.findOneReason('non-existent')).rejects.toThrow(
          NotFoundException,
        )
      })
    })

    describe('updateReason', () => {
      const id = 'Test Reason 1'

      beforeEach(async () => {
        await db.inventoryTransferReason.create({
          data: {
            id,
            name: id,
          },
        })
      })

      const data: UpdateInventoryTransferReasonDto = {
        name: 'Updated Reason 1',
      }

      it('should successfully update the requested reason', async () => {
        await service.updateReason(id, data)

        const reason = await db.inventoryTransferReason.findFirst()

        expect(reason?.name).toBe(data.name)
      })

      it('should fail if the reason does not exist', async () => {
        await expect(
          service.updateReason('non-existent', data),
        ).rejects.toThrow(NotFoundException)
      })
    })

    describe('removeReason', () => {
      const id = 'Test Reason 1'

      beforeEach(async () => {
        await db.inventoryTransferReason.create({
          data: {
            id,
            name: id,
          },
        })
      })

      it('should successfully remove the requested reason', async () => {
        await service.removeReason(id)

        const reasonsCount = await db.inventoryTransferReason.count()

        expect(reasonsCount).toBe(0)
      })

      it('should fail if the reason is connected to an inventory transfer document', async () => {
        await db.inventoryTransfer.create({
          data: {
            date: new Date(),
            name: 'Test Inventory Transfer',
            reasonId: id,
          },
        })

        await expect(service.removeReason(id)).rejects.toThrow(
          BadRequestException,
        )
      })

      it('should fail if the reason does not exist', async () => {
        await expect(service.removeReason('non-existent')).rejects.toThrow(
          NotFoundException,
        )
      })
    })
  })

  describe('transfers', () => {
    const sourceWarehouseId = 'Source Warehouse Id'
    const destinationWarehouseId = 'Destination Warehouse Id'
    const reasonId = 'Test Reason 1'
    const variantId1 = 'Test Variant 1'
    const variantId2 = 'Test Variant 2'

    beforeEach(async () => {
      await Promise.all([
        db.warehouse.createMany({
          data: [
            {
              id: sourceWarehouseId,
              address: sourceWarehouseId,
              name: sourceWarehouseId,
            },
            {
              id: destinationWarehouseId,
              address: destinationWarehouseId,
              name: destinationWarehouseId,
            },
          ],
        }),
        db.inventoryTransferReason.create({
          data: {
            id: reasonId,
            name: reasonId,
          },
        }),
      ])

      await Promise.all([
        db.variant.create({
          data: {
            id: variantId1,
            price: 10,
            size: variantId1,
            totalReceivedQuantity: 10,
            totalWarehouseQuantity: 10,
            warehouseStockEntries: {
              create: {
                warehouseId: sourceWarehouseId,
                warehouseQuantity: 10,
              },
            },
            barcode: 'asdf',
          },
        }),
        db.variant.create({
          data: {
            id: variantId2,
            price: 10,
            size: variantId2,
            totalReceivedQuantity: 10,
            totalWarehouseQuantity: 10,
            warehouseStockEntries: {
              create: {
                warehouseId: sourceWarehouseId,
                warehouseQuantity: 10,
              },
            },
            barcode: 'asd1',
          },
        }),
      ])
    })

    describe('create', () => {
      const data: CreateInventoryTransferDto = {
        date: new Date(),
        destinationWarehouseId,
        sourceWarehouseId,
        reasonId,
        transferItems: [],
      }

      it('should create a simple inventory transfer with no items', async () => {
        await service.create(data)

        const inventoryTransfer = await db.inventoryTransfer.findFirst()

        expect(inventoryTransfer).toBeDefined()
        expect(inventoryTransfer?.name).toBe('Накладная перемещения #1')
      })

      it('should move variant to the destination warehouse', async () => {
        await service.create({
          ...data,
          transferItems: [
            {
              variantId: variantId1,
              quantity: 8,
            },
          ],
        })

        const transferItem = await db.inventoryTransferItem.findFirst()
        const remainedVtw = await db.variantToWarehouse.findFirst({
          where: {
            variantId: variantId1,
            warehouseId: sourceWarehouseId,
          },
        })
        const movedVtw = await db.variantToWarehouse.findFirst({
          where: {
            variantId: variantId1,
            warehouseId: destinationWarehouseId,
          },
        })

        expect(transferItem?.quantity).toBe(8)
        expect(transferItem?.variantId).toBe(variantId1)
        expect(remainedVtw?.warehouseQuantity).toBe(2)
        expect(movedVtw?.warehouseQuantity).toBe(8)
      })

      it('should fail if the source warehouse does not exist', async () => {
        await expect(
          service.create({ ...data, sourceWarehouseId: 'non-existent' }),
        ).rejects.toThrow(NotFoundException)
      })

      it('should fail if the destination warehouse does not exist', async () => {
        await expect(
          service.create({ ...data, destinationWarehouseId: 'non-existent' }),
        ).rejects.toThrow(NotFoundException)
      })

      it('should fail if the reason does not exist', async () => {
        await expect(
          service.create({ ...data, reasonId: 'non-existent' }),
        ).rejects.toThrow(NotFoundException)
      })
    })

    describe('findAll', () => {
      beforeEach(async () => {
        await Promise.all([
          db.inventoryTransfer.createMany({
            data: [
              {
                name: 'Test Transfer 1',
                date: new Date(),
                reasonId,
              },
              {
                name: 'Test Transfer 2',
                date: new Date(),
                destinationWarehouseId,
                sourceWarehouseId,
              },
              {
                name: 'Test Transfer 3',
                date: new Date(),
              },
              {
                name: 'Test Transfer 4',
                date: new Date(),
                isArchived: true,
              },
            ],
          }),
        ])
      })

      const data: FindAllInventoryTransferDto = {
        page: 1,
        rowsPerPage: 10,
        orderBy: undefined,
        query: undefined,
      }

      it('should list all inventory transfers', async () => {
        const { items } = await service.findAll(data)

        expect(items.length).toBe(3)
      })

      it('should return correct pagination info', async () => {
        const { info } = await service.findAll(data)

        expect(info.totalItems).toBe(3)
        expect(info.totalPages).toBe(1)
      })

      it('should filter items by name query', async () => {
        const { info } = await service.findAll({
          ...data,
          query: 'Test Transfer 1',
        })

        expect(info.totalItems).toBe(1)
      })

      it('should filter items by isArchived status', async () => {
        const { info } = await service.findAll({ ...data, isArchived: 1 })

        expect(info.totalItems).toBe(1)
      })

      it('should filter items by source warehouse id', async () => {
        const { info } = await service.findAll({
          ...data,
          sourceWarehouseIds: [sourceWarehouseId],
        })

        expect(info.totalItems).toBe(1)
      })

      it('should filter items by destination warehouse id', async () => {
        const { info } = await service.findAll({
          ...data,
          destinationWarehouseIds: [destinationWarehouseId],
        })

        expect(info.totalItems).toBe(1)
      })

      it('should filter items by inventory transfer reason id', async () => {
        const { info } = await service.findAll({
          ...data,
          reasonIds: [reasonId],
        })

        expect(info.totalItems).toBe(1)
      })
    })

    describe('findOne', () => {
      const id = 'Test Transfer 1'

      beforeEach(async () => {
        await db.inventoryTransfer.create({
          data: {
            id,
            date: new Date(),
            name: id,
            sourceWarehouse: {
              create: {
                address: 'test',
                name: 'test',
              },
            },
          },
        })
      })

      it('should find the requested inventory transfer', async () => {
        const data = await service.findOne(id)

        expect(data.id).toBe(id)
      })

      it('should fail if the inventory transfer does not exist', async () => {
        await expect(service.findOne('non-existent')).rejects.toThrow(
          NotFoundException,
        )
      })
    })

    describe('update', () => {
      const id = 'Test Transfer 1'

      beforeEach(async () => {
        await db.inventoryTransfer.create({
          data: {
            id,
            date: new Date(),
            name: id,
            destinationWarehouseId,
            sourceWarehouseId,
          },
        })
      })

      it('should successfully update basic properties of the inventory transfer', async () => {
        const data: UpdateInventoryTransferDto = {
          reasonId,
        }

        await service.update(id, data)

        const inventoryTransfer = await db.inventoryTransfer.findUnique({
          where: {
            id,
          },
        })

        expect(inventoryTransfer?.reasonId).toBe(reasonId)
      })

      it('should correctly move new items to the destination warehouse', async () => {
        const data: UpdateInventoryTransferDto = {
          transferItems: [
            {
              variantId: variantId1,
              quantity: 8,
            },
          ],
        }

        await service.update(id, data)

        const transferItem = await db.inventoryTransferItem.findFirst()
        const remainedVtw = await db.variantToWarehouse.findFirst({
          where: {
            variantId: variantId1,
            warehouseId: sourceWarehouseId,
          },
        })
        const movedVtw = await db.variantToWarehouse.findFirst({
          where: {
            variantId: variantId1,
            warehouseId: destinationWarehouseId,
          },
        })

        expect(transferItem?.quantity).toBe(8)
        expect(transferItem?.variantId).toBe(variantId1)
        expect(remainedVtw?.warehouseQuantity).toBe(2)
        expect(movedVtw?.warehouseQuantity).toBe(8)
      })

      it('should correctly move existing items to the updated destination warehouse', async () => {
        await Promise.all([
          db.inventoryTransfer.update({
            where: {
              id,
            },
            data: {
              transferItems: {
                create: {
                  variantId: variantId1,
                  quantity: 5,
                },
              },
            },
          }),
          db.variantToWarehouse.updateMany({
            where: {
              warehouseId: sourceWarehouseId,
              variantId: variantId1,
            },
            data: {
              warehouseQuantity: 5,
            },
          }),
          db.variantToWarehouse.create({
            data: {
              warehouseId: destinationWarehouseId,
              variantId: variantId1,
              warehouseQuantity: 5,
            },
          }),
          db.warehouse.create({
            data: {
              id: 'Test Warehouse',
              address: 'test',
              name: 'test',
            },
          }),
        ])

        const data: UpdateInventoryTransferDto = {
          destinationWarehouseId: 'Test Warehouse',
          transferItems: [
            {
              quantity: 5,
              variantId: variantId1,
            },
          ],
        }

        await service.update(id, data)

        const [sourceVtw, oldDestinationVtw, newDestinationVtw] =
          await Promise.all([
            db.variantToWarehouse.findFirst({
              where: {
                variantId: variantId1,
                warehouseId: sourceWarehouseId,
              },
            }),
            db.variantToWarehouse.findFirst({
              where: {
                variantId: variantId1,
                warehouseId: destinationWarehouseId,
              },
            }),
            db.variantToWarehouse.findFirst({
              where: {
                variantId: variantId1,
                warehouseId: 'Test Warehouse',
              },
            }),
          ])

        expect(sourceVtw?.warehouseQuantity).toBe(5)
        expect(oldDestinationVtw?.warehouseQuantity).toBe(0)
        expect(newDestinationVtw?.warehouseQuantity).toBe(5)
      })

      it('should return removed items to the source warehouse', async () => {
        await Promise.all([
          db.inventoryTransfer.update({
            where: {
              id,
            },
            data: {
              transferItems: {
                create: {
                  variantId: variantId1,
                  quantity: 5,
                },
              },
            },
          }),
          db.variantToWarehouse.updateMany({
            where: {
              warehouseId: sourceWarehouseId,
              variantId: variantId1,
            },
            data: {
              warehouseQuantity: 5,
            },
          }),
          db.variantToWarehouse.create({
            data: {
              warehouseId: destinationWarehouseId,
              variantId: variantId1,
              warehouseQuantity: 5,
            },
          }),
        ])

        const data: UpdateInventoryTransferDto = {
          transferItems: [],
        }

        await service.update(id, data)

        const [sourceVtw, destinationVtw, transferItemsCount] =
          await Promise.all([
            db.variantToWarehouse.findFirst({
              where: {
                warehouseId: sourceWarehouseId,
                variantId: variantId1,
              },
            }),
            db.variantToWarehouse.findFirst({
              where: {
                warehouseId: destinationWarehouseId,
                variantId: variantId1,
              },
            }),
            db.inventoryTransferItem.count(),
          ])

        expect(sourceVtw?.warehouseQuantity).toBe(10)
        expect(destinationVtw?.warehouseQuantity).toBe(0)
        expect(transferItemsCount).toBe(0)
      })

      it('should fail if the inventory transfer does not exist', async () => {
        await expect(service.update('non-existent', {})).rejects.toThrow(
          NotFoundException,
        )
      })

      it('should fail if the source warehouse does not exist', async () => {
        await expect(
          service.update(id, { sourceWarehouseId: 'non-existent' }),
        ).rejects.toThrow(NotFoundException)
      })

      it('should fail if the destination warehouse does not exist', async () => {
        await expect(
          service.update(id, {
            destinationWarehouseId: 'non-existent',
          }),
        ).rejects.toThrow(NotFoundException)
      })

      it('should fail if the reason does not exist', async () => {
        await expect(
          service.update(id, { reasonId: 'non-existent' }),
        ).rejects.toThrow(NotFoundException)
      })
    })

    describe('archive', () => {
      const id = 'Test Transfer 1'

      beforeEach(async () => {
        await db.inventoryTransfer.create({
          data: {
            id,
            date: new Date(),
            name: id,
            destinationWarehouseId,
            sourceWarehouseId,
          },
        })
      })

      it('should assign isArchived status to true', async () => {
        await service.archive(id)

        const inventoryTransfer = await db.inventoryTransfer.findUnique({
          where: {
            id,
          },
        })

        expect(inventoryTransfer?.isArchived).toBeTruthy()
      })

      it('should move variants to the source warehouse', async () => {
        await Promise.all([
          db.inventoryTransfer.update({
            where: {
              id,
            },
            data: {
              transferItems: {
                create: {
                  variantId: variantId1,
                  quantity: 5,
                },
              },
            },
          }),
          db.variantToWarehouse.updateMany({
            where: {
              warehouseId: sourceWarehouseId,
              variantId: variantId1,
            },
            data: {
              warehouseQuantity: 5,
            },
          }),
          db.variantToWarehouse.create({
            data: {
              warehouseId: destinationWarehouseId,
              variantId: variantId1,
              warehouseQuantity: 5,
            },
          }),
        ])

        await service.archive(id)

        const [sourceVtw, destinationVtw, transferItemsCount] =
          await Promise.all([
            db.variantToWarehouse.findFirst({
              where: {
                warehouseId: sourceWarehouseId,
                variantId: variantId1,
              },
            }),
            db.variantToWarehouse.findFirst({
              where: {
                warehouseId: destinationWarehouseId,
                variantId: variantId1,
              },
            }),
            db.inventoryTransferItem.count(),
          ])

        expect(sourceVtw?.warehouseQuantity).toBe(10)
        expect(destinationVtw?.warehouseQuantity).toBe(0)
        expect(transferItemsCount).toBe(1)
      })

      it('should fail if the inventory transfer does not exist', async () => {
        await expect(service.archive('non-existent')).rejects.toThrow(
          NotFoundException,
        )
      })
    })

    describe('restore', () => {
      const id = 'Test Transfer 1'

      beforeEach(async () => {
        await db.inventoryTransfer.create({
          data: {
            id,
            date: new Date(),
            name: id,
            destinationWarehouseId,
            sourceWarehouseId,
          },
        })
      })

      it('should assign isArchived status to false', async () => {
        await service.restore(id)

        const inventoryTransfer = await db.inventoryTransfer.findUnique({
          where: {
            id,
          },
        })

        expect(inventoryTransfer?.isArchived).toBeFalsy()
      })

      it('should move variants to the destination warehouse', async () => {
        await Promise.all([
          db.inventoryTransfer.update({
            where: {
              id,
            },
            data: {
              transferItems: {
                create: {
                  variantId: variantId1,
                  quantity: 5,
                },
              },
            },
          }),
          db.variantToWarehouse.updateMany({
            where: {
              warehouseId: sourceWarehouseId,
              variantId: variantId1,
            },
            data: {
              warehouseQuantity: 10,
            },
          }),
          db.variantToWarehouse.create({
            data: {
              warehouseId: destinationWarehouseId,
              variantId: variantId1,
              warehouseQuantity: 0,
            },
          }),
        ])

        await service.restore(id)

        const [sourceVtw, destinationVtw, transferItemsCount] =
          await Promise.all([
            db.variantToWarehouse.findFirst({
              where: {
                warehouseId: sourceWarehouseId,
                variantId: variantId1,
              },
            }),
            db.variantToWarehouse.findFirst({
              where: {
                warehouseId: destinationWarehouseId,
                variantId: variantId1,
              },
            }),
            db.inventoryTransferItem.count(),
          ])

        expect(sourceVtw?.warehouseQuantity).toBe(5)
        expect(destinationVtw?.warehouseQuantity).toBe(5)
        expect(transferItemsCount).toBe(1)
      })

      it('should fail if the inventory transfer does not exist', async () => {
        await expect(service.restore('non-existent')).rejects.toThrow(
          NotFoundException,
        )
      })
    })
  })
})
