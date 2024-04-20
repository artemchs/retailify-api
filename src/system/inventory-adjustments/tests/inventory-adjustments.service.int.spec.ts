import { Test } from '@nestjs/testing'
import { DbService } from '../../../db/db.service'
import { InventoryAdjustmentsService } from '../inventory-adjustments.service'
import { AppModule } from 'src/app.module'
import { CreateInventoryAdjustmentDto } from '../dto/create-inventory-adjustment.dto'
import { FindAllInventoryAdjustmentDto } from '../dto/findAll-inventory-adjustment.dto'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { UpdateInventoryAdjustmentDto } from '../dto/update-inventory-adjustment.dto'
import { CreateInventoryAdjustmentReasonDto } from '../dto/create-inventory-adjustment-reason.dto'
import { UpdateInventoryAdjustmentReasonDto } from '../dto/update-inventory-adjustment-reason.dto'

describe('InventoryAdjustmentsService', () => {
  let service: InventoryAdjustmentsService
  let db: DbService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    db = moduleRef.get(DbService)
    service = moduleRef.get(InventoryAdjustmentsService)

    await db.reset()
  })

  afterEach(async () => await db.reset())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  beforeEach(async () => {
    await Promise.all([
      db.inventoryAdjustmentReason.create({
        data: {
          id: 'Test Reason 1',
          name: 'Test Reason 1',
        },
      }),
      db.warehouse.create({
        data: {
          id: 'Test Warehouse 1',
          address: 'asdf',
          name: 'Test Warehouse 1',
        },
      }),
    ])

    await db.product.create({
      data: {
        id: 'Test Product 1',
        gender: 'UNISEX',
        packagingHeight: 1,
        packagingLength: 1,
        packagingWeight: 1,
        packagingWidth: 1,
        season: 'ALL_SEASON',
        sku: '12345',
        title: 'Test Product 1',
        totalReceivedQuantity: 10,
        totalWarehouseQuantity: 10,
        variants: {
          create: {
            id: 'Test Variant 1',
            price: 10,
            size: 'SM',
            totalReceivedQuantity: 10,
            totalWarehouseQuantity: 10,
            warehouseStockEntries: {
              create: {
                id: 'Test Vtw 1',
                warehouseQuantity: 10,
                warehouseId: 'Test Warehouse 1',
              },
            },
            barcode: 'asdf',
          },
        },
      },
    })
  })

  describe('create', () => {
    const data: CreateInventoryAdjustmentDto = {
      date: new Date(),
      reasonId: 'Test Reason 1',
      warehouseId: 'Test Warehouse 1',
      variants: [
        {
          quantityChange: -5,
          variantToWarehouseId: 'Test Vtw 1',
        },
      ],
    }

    it('should successfully create a new inventory adjustment', async () => {
      await service.create(data)

      const inventoryAdjustmentsCount = await db.inventoryAdjustment.count()
      const product = await db.product.findUnique({
        where: {
          id: 'Test Product 1',
        },
      })
      const variant = await db.variant.findUnique({
        where: {
          id: 'Test Variant 1',
        },
      })
      const vtw = await db.variantToWarehouse.findUnique({
        where: {
          id: 'Test Vtw 1',
        },
      })

      expect(inventoryAdjustmentsCount).toBe(1)
      expect(product?.totalReceivedQuantity).toBe(10)
      expect(product?.totalWarehouseQuantity).toBe(5)
      expect(variant?.totalReceivedQuantity).toBe(10)
      expect(variant?.totalWarehouseQuantity).toBe(5)
      expect(vtw?.warehouseQuantity).toBe(5)
    })
  })

  describe('findAll', () => {
    beforeEach(async () => {
      await db.inventoryAdjustment.createMany({
        data: [
          {
            name: 'Test Inventory Adjustment 1',
            date: new Date(),
            warehouseId: 'Test Warehouse 1',
            reasonId: 'Test Reason 1',
          },
          {
            name: 'Test Inventory Adjustment 2',
            date: new Date(),
          },
          {
            name: 'Test Inventory Adjustment 3',
            date: new Date(),
          },
          {
            name: 'Test Inventory Adjustment 4',
            date: new Date(),
            isArchived: true,
          },
        ],
      })
    })

    const data: FindAllInventoryAdjustmentDto = {
      page: 1,
      rowsPerPage: 10,
      orderBy: undefined,
      query: undefined,
    }

    it('should list all inventory adjustments', async () => {
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
        query: 'Test Inventory Adjustment 1',
      })

      expect(info.totalItems).toBe(1)
    })

    it('should filter items by isArchived status', async () => {
      const { info } = await service.findAll({ ...data, isArchived: 1 })

      expect(info.totalItems).toBe(1)
    })

    it('should filter items by warehouse id', async () => {
      const { info } = await service.findAll({
        ...data,
        warehouseIds: ['Test Warehouse 1'],
      })

      expect(info.totalItems).toBe(1)
    })

    it('should filter items by inventory adjustment reason id', async () => {
      const { info } = await service.findAll({
        ...data,
        reasonIds: ['Test Reason 1'],
      })

      expect(info.totalItems).toBe(1)
    })
  })

  describe('findOne', () => {
    const id = 'Test Inventory Adjustment 1'

    beforeEach(async () => {
      await db.inventoryAdjustment.create({
        data: {
          id,
          date: new Date(),
          name: '',
        },
      })
    })

    it('should find the requested inventory adjustment', async () => {
      const res = await service.findOne(id)

      expect(res.id).toBe(id)
    })

    it('should throw an exception if the inventory adjustment does not exist', async () => {
      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('update', () => {
    const id = 'Test Inventory Adjustment 1'

    beforeEach(async () => {
      await db.inventoryAdjustment.create({
        data: {
          id,
          date: new Date(),
          name: '',
          variants: {
            create: {
              variantToWarehouseId: 'Test Vtw 1',
              quantityChange: -1,
            },
          },
        },
      })
    })

    const data: UpdateInventoryAdjustmentDto = {
      variants: [
        {
          quantityChange: +1,
          variantToWarehouseId: 'Test Vtw 1',
        },
      ],
    }

    it('should successfully update the requested inventory adjustment', async () => {
      await service.update(id, data)

      const inventoryAdjustmentsCount = await db.inventoryAdjustment.count()
      const product = await db.product.findUnique({
        where: {
          id: 'Test Product 1',
        },
      })
      const variant = await db.variant.findUnique({
        where: {
          id: 'Test Variant 1',
        },
      })
      const vtw = await db.variantToWarehouse.findUnique({
        where: {
          id: 'Test Vtw 1',
        },
      })

      expect(inventoryAdjustmentsCount).toBe(1)
      expect(product?.totalReceivedQuantity).toBe(10)
      expect(product?.totalWarehouseQuantity).toBe(12)
      expect(variant?.totalReceivedQuantity).toBe(10)
      expect(variant?.totalWarehouseQuantity).toBe(12)
      expect(vtw?.warehouseQuantity).toBe(12)
    })

    it('should fail if the inventory adjustment does not exist', async () => {
      await expect(service.update('non-existent', data)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('archive', () => {
    const id = 'Test Inventory Adjustment 1'

    beforeEach(async () => {
      await db.inventoryAdjustment.create({
        data: {
          id,
          date: new Date(),
          name: '',
          variants: {
            create: {
              variantToWarehouseId: 'Test Vtw 1',
              quantityChange: -1,
            },
          },
        },
      })
    })

    it('should archive the requested inventory adjustment', async () => {
      await service.archive(id)

      const inventoryAdjustment = await db.inventoryAdjustment.findUnique({
        where: {
          id,
        },
      })
      const product = await db.product.findUnique({
        where: {
          id: 'Test Product 1',
        },
      })
      const variant = await db.variant.findUnique({
        where: {
          id: 'Test Variant 1',
        },
      })
      const vtw = await db.variantToWarehouse.findUnique({
        where: {
          id: 'Test Vtw 1',
        },
      })

      expect(inventoryAdjustment?.isArchived).toBeTruthy()
      expect(product?.totalReceivedQuantity).toBe(10)
      expect(product?.totalWarehouseQuantity).toBe(11)
      expect(variant?.totalReceivedQuantity).toBe(10)
      expect(variant?.totalWarehouseQuantity).toBe(11)
      expect(vtw?.warehouseQuantity).toBe(11)
    })

    it('should fail if the inventory adjustment does not exist', async () => {
      await expect(service.archive('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('restore', () => {
    const id = 'Test Inventory Adjustment 1'

    beforeEach(async () => {
      await db.inventoryAdjustment.create({
        data: {
          id,
          date: new Date(),
          name: '',
          variants: {
            create: {
              variantToWarehouseId: 'Test Vtw 1',
              quantityChange: -1,
            },
          },
          isArchived: true,
        },
      })
    })

    it('should restore the requested inventory adjustment', async () => {
      await service.restore(id)

      const inventoryAdjustment = await db.inventoryAdjustment.findUnique({
        where: {
          id,
        },
      })
      const product = await db.product.findUnique({
        where: {
          id: 'Test Product 1',
        },
      })
      const variant = await db.variant.findUnique({
        where: {
          id: 'Test Variant 1',
        },
      })
      const vtw = await db.variantToWarehouse.findUnique({
        where: {
          id: 'Test Vtw 1',
        },
      })

      expect(inventoryAdjustment?.isArchived).toBeFalsy()
      expect(product?.totalReceivedQuantity).toBe(10)
      expect(product?.totalWarehouseQuantity).toBe(9)
      expect(variant?.totalReceivedQuantity).toBe(10)
      expect(variant?.totalWarehouseQuantity).toBe(9)
      expect(vtw?.warehouseQuantity).toBe(9)
    })

    it('should fail if the inventory adjustment does not exist', async () => {
      await expect(service.restore('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('createReason', () => {
    const data: CreateInventoryAdjustmentReasonDto = {
      name: 'Test Reason 1',
    }

    it('should successfully create a new reason', async () => {
      await service.createReason(data)

      const reasonsCount = await db.inventoryAdjustmentReason.count()

      expect(reasonsCount).toBe(2)
    })
  })

  describe('findAllReasons', () => {
    beforeEach(async () => {
      await db.inventoryAdjustmentReason.createMany({
        data: [
          {
            name: 'Test Reason 1',
          },
          {
            name: 'Test Reason 2',
          },
        ],
      })
    })

    it('should list all reasons', async () => {
      const reasons = await service.findAllReasons({})

      expect(reasons.items.length).toBe(3)
    })
  })

  describe('findOneReason', () => {
    const id = 'Test Reason 1'

    it('should find the requested reason', async () => {
      const res = await service.findOneReason(id)

      expect(res?.id).toBe(id)
    })

    it('should throw an exception if the reason does not exist', async () => {
      await expect(service.findOneReason('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('updateReason', () => {
    const id = 'Test Reason 1'

    const data: UpdateInventoryAdjustmentReasonDto = {
      name: 'Updated Test Reason 1',
    }

    it('should update the requested reason', async () => {
      await service.updateReason(id, data)

      const reason = await db.inventoryAdjustmentReason.findUnique({
        where: {
          id,
        },
      })

      expect(reason?.name).toBe(data.name)
    })

    it('should throw an exception if the reason does not exist', async () => {
      await expect(service.updateReason('non-existent', data)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('removeReason', () => {
    const id = 'Test Reason 1'

    it('should successfully remove the requested reason', async () => {
      await service.removeReason(id)

      const reasonsCount = await db.inventoryAdjustmentReason.count()

      expect(reasonsCount).toBe(0)
    })

    it('should fail if the reason is connected to an inventory adjustment document', async () => {
      await db.inventoryAdjustmentReason.create({
        data: {
          id: 'Test Reason 2',
          name: 'Test Reason 2',
        },
      })

      await db.inventoryAdjustment.create({
        data: {
          date: new Date(),
          name: '',
          reasonId: 'Test Reason 2',
        },
      })

      await expect(service.removeReason('Test Reason 2')).rejects.toThrow(
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
