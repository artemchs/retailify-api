import { Test } from '@nestjs/testing'
import { AppModule } from 'src/app.module'
import { DbService } from 'src/db/db.service'
import { CreateRefundDto } from '../dto/create-refund.dto'
import { NotFoundException } from '@nestjs/common'
import { RefundsService } from '../refunds.service'
import { FindAllRefundDto } from '../dto/findAll-refund.dto'

describe('RefundsService', () => {
  let service: RefundsService
  let db: DbService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    db = moduleRef.get(DbService)
    service = moduleRef.get(RefundsService)

    await db.reset()
  })

  afterEach(async () => await db.reset())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  const warehouseId = 'Test Warehouse'
  const posId = 'Test POS'
  const shiftId = 'Test Shift'
  const cashierId = 'Test Cashier'
  const customerId = 'Test Customer'

  beforeEach(async () => {
    await Promise.all([
      db.warehouse.create({
        data: {
          id: warehouseId,
          address: 'asdf',
          name: 'asdf',
        },
      }),
      db.customer.create({
        data: {
          id: customerId,
          firstName: 'asdf',
          lastName: 'asdf',
          phoneNumber: '2134',
        },
      }),
    ])

    await db.pointOfSale.create({
      data: {
        id: posId,
        address: 'asdf',
        name: 'asf',
        warehouseId,
      },
    })

    await db.cashierShift.create({
      data: {
        id: shiftId,
        isOpened: true,
        name: 'asdf',
        startingCashBalance: 0,
        cashier: {
          create: {
            id: cashierId,
            email: cashierId,
            fullName: cashierId,
            hash: 'asdf',
          },
        },
        pointOfSale: {
          connect: {
            id: posId,
          },
        },
      },
    })

    await Promise.all([
      db.product.create({
        data: {
          id: 'Test Product 1',
          gender: 'UNISEX',
          packagingHeight: 1,
          packagingLength: 1,
          packagingWeight: 1,
          packagingWidth: 1,
          season: 'ALL_SEASON',
          sku: '1',
          title: 'Test Product 1',
          totalWarehouseQuantity: 10,
          variants: {
            create: {
              id: 'Variant 1',
              price: 100,
              size: 'XL',
              totalReceivedQuantity: 10,
              totalWarehouseQuantity: 10,
              warehouseStockEntries: {
                create: {
                  id: 'Vtw 1',
                  warehouseId,
                  warehouseQuantity: 10,
                },
              },
            },
          },
        },
      }),
      db.product.create({
        data: {
          id: 'Test Product 2',
          gender: 'UNISEX',
          packagingHeight: 1,
          packagingLength: 1,
          packagingWeight: 1,
          packagingWidth: 1,
          season: 'ALL_SEASON',
          sku: '2',
          title: 'Test Product 2',
          totalWarehouseQuantity: 10,
          variants: {
            create: {
              id: 'Variant 2',
              price: 100,
              sale: 10,
              size: 'XL',
              totalReceivedQuantity: 10,
              totalWarehouseQuantity: 10,
              warehouseStockEntries: {
                create: {
                  id: 'Vtw 2',
                  warehouseId,
                  warehouseQuantity: 10,
                },
              },
            },
          },
        },
      }),
      db.product.create({
        data: {
          id: 'Test Product 3',
          gender: 'UNISEX',
          packagingHeight: 1,
          packagingLength: 1,
          packagingWeight: 1,
          packagingWidth: 1,
          season: 'ALL_SEASON',
          sku: '3',
          title: 'Test Product 3',
          totalWarehouseQuantity: 10,
          variants: {
            create: {
              id: 'Variant 3',
              price: 100,
              size: 'XL',
              totalReceivedQuantity: 10,
              totalWarehouseQuantity: 10,
              warehouseStockEntries: {
                create: {
                  id: 'Vtw 3',
                  warehouseId,
                  warehouseQuantity: 10,
                },
              },
            },
          },
        },
      }),
    ])
  })

  describe('create', () => {
    const id = 'Order'

    beforeEach(async () => {
      await db.order.create({
        data: {
          id,
          name: 'asdf',
          shiftId,
          items: {
            create: {
              id: 'Order Item 1',
              vtwId: 'Vtw 1',
              quantity: 1,
              pricePerItemWithDiscount: 100,
            },
          },
        },
      })

      await db.orderInvoice.create({
        data: {
          paymentMethod: 'CARD',
          totalCardAmount: 100,
          totalCashAmount: 0,
          order: {
            connect: {
              id,
            },
          },
        },
      })
    })

    const data: CreateRefundDto = {
      orderId: id,
      items: [
        {
          id: 'Order Item 1',
          quantity: 1,
        },
      ],
    }

    it('should create a refund', async () => {
      await service.create(data, shiftId)

      const refundsCount = await db.refund.count()

      expect(refundsCount).toBe(1)
    })

    it('should create a transaction for the total amount of the refunded goods', async () => {
      await service.create(data, shiftId)

      const transactionsCount = await db.transaction.count()
      const transaction = await db.transaction.findFirst()

      expect(transactionsCount).toBe(1)
      expect(Number(transaction?.amount)).toBe(-100)
    })

    it('should increment quantities of the refunded items', async () => {
      await service.create(data, shiftId)

      const vtw = await db.variantToWarehouse.findUnique({
        where: {
          id: 'Vtw 1',
        },
      })
      const variant = await db.variant.findUnique({
        where: {
          id: 'Variant 1',
        },
      })
      const product = await db.product.findUnique({
        where: {
          id: 'Test Product 1',
        },
      })

      expect(vtw?.warehouseQuantity).toBe(11)
      expect(variant?.totalWarehouseQuantity).toBe(11)
      expect(product?.totalWarehouseQuantity).toBe(11)
    })

    it('should fail if the order does not exist', async () => {
      await expect(
        service.create(
          {
            ...data,
            orderId: 'non-existent',
          },
          shiftId,
        ),
      ).rejects.toThrow(NotFoundException)
    })

    it('should fail if the shift does not exist', async () => {
      await expect(service.create(data, 'non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('findAll', () => {
    beforeEach(async () => {
      await Promise.all([
        db.refund.create({
          data: {
            amount: 100,
            name: 'refund 1',
          },
        }),
        db.refund.create({
          data: {
            amount: 100,
            name: 'refund 2',
          },
        }),
        db.refund.create({
          data: {
            amount: 100,
            name: 'refund 3',
          },
        }),
      ])
    })

    const data: FindAllRefundDto = {
      page: 1,
      rowsPerPage: 10,
      orderBy: undefined,
      query: undefined,
    }

    it('should list all refunds', async () => {
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
        query: 'refund 1',
      })

      expect(info.totalItems).toBe(1)
    })
  })

  describe('findOne', () => {
    const id = 'refund'

    beforeEach(async () => {
      await db.refund.create({
        data: {
          id,
          name: 'asdf',
          amount: 1234,
        },
      })
    })

    it('should find the requested item', async () => {
      const data = await service.findOne(id)

      expect(data?.id).toBe(id)
    })

    it('should fail if the item does not exist', async () => {
      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
