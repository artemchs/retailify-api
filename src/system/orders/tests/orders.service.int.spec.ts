import { Test } from '@nestjs/testing'
import { DbService } from '../../../db/db.service'
import { OrdersService } from '../orders.service'
import { AppModule } from 'src/app.module'
import { CreateOrderDto } from '../dto/create-order.dto'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { FindAllOrderDto } from '../dto/findAll-order.dto'

describe('OrdersService', () => {
  let service: OrdersService
  let db: DbService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    db = moduleRef.get(DbService)
    service = moduleRef.get(OrdersService)

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
    const data: CreateOrderDto = {
      items: [
        {
          id: 'Variant1',
          quantity: 1,
        },
      ],
      paymentMethod: 'CARD',
      posId,
      customerId,
    }

    it('should create a new order', async () => {
      await service.create(data, shiftId)

      const ordersCount = await db.order.count()
      const invoicesCount = await db.orderInvoice.count()

      expect(ordersCount).toBe(1)
      expect(invoicesCount).toBe(1)
    })

    it('should correctly decrement the quantity of the product', async () => {
      await service.create(
        {
          ...data,
          items: [
            {
              id: 'Variant 1',
              quantity: 1,
            },
          ],
        },
        shiftId,
      )

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

      console.log({ vtw })

      expect(vtw?.warehouseQuantity).toBe(9)
      expect(variant?.totalWarehouseQuantity).toBe(9)
      expect(product?.totalWarehouseQuantity).toBe(9)
    })

    it('should create correct order invoice and transaction', async () => {
      await service.create(
        {
          ...data,
          items: [
            {
              id: 'Variant 2',
              quantity: 1,
            },
          ],
          paymentMethod: 'CASH',
        },
        shiftId,
      )

      const orderInvoice = await db.orderInvoice.findFirst()
      const transaction = await db.transaction.findFirst()

      expect(orderInvoice?.paymentMethod).toBe('CASH')
      expect(Number(orderInvoice?.totalCashAmount)).toBe(90)
      expect(Number(orderInvoice?.totalCardAmount)).toBe(0)
      expect(Number(transaction?.amount)).toBe(90)
      expect(transaction?.type).toBe('ORDER_PAYMENT')
      expect(transaction?.direction).toBe('CREDIT')
    })

    it('should correctly create a mixed payment inovice and transaction', async () => {
      await service.create(
        {
          ...data,
          items: [
            {
              id: 'Variant 1',
              quantity: 1,
            },
          ],
          paymentMethod: 'MIXED',
          totalCardAmount: 50,
          totalCashAmount: 50,
        },
        shiftId,
      )

      const orderInvoice = await db.orderInvoice.findFirst()
      const transactionsCount = await db.transaction.count()

      expect(orderInvoice?.paymentMethod).toBe('MIXED')
      expect(Number(orderInvoice?.totalCardAmount)).toBe(50)
      expect(Number(orderInvoice?.totalCashAmount)).toBe(50)
      expect(transactionsCount).toBe(2)
    })

    it('should correctly apply item-level custom discount in monetary value', async () => {
      await service.create(
        {
          ...data,
          items: [
            {
              id: 'Variant 1',
              quantity: 1,
              customSaleType: 'FIXED-AMOUNT',
              customSaleFixedAmount: 50,
            },
          ],
        },
        shiftId,
      )

      const orderInvoice = await db.orderInvoice.findFirst()
      const orderItem = await db.customerOrderItem.findFirst()
      const transaction = await db.transaction.findFirst()

      expect(Number(orderInvoice?.totalCardAmount)).toBe(50)
      expect(Number(orderItem?.customDiscount)).toBe(50)
      expect(Number(transaction?.amount)).toBe(50)
    })

    it('should correctly apply item-level custom discount in percentages', async () => {
      await service.create(
        {
          ...data,
          items: [
            {
              id: 'Variant 1',
              quantity: 1,
              customSaleType: 'PERCENTAGE',
              customSalePercentage: 50,
            },
          ],
        },
        shiftId,
      )

      const orderInvoice = await db.orderInvoice.findFirst()
      const orderItem = await db.customerOrderItem.findFirst()
      const transaction = await db.transaction.findFirst()

      expect(Number(orderInvoice?.totalCardAmount)).toBe(50)
      expect(Number(orderItem?.customDiscount)).toBe(50)
      expect(Number(transaction?.amount)).toBe(50)
    })

    it('should correctly apply bulk custom discount in monetary value', async () => {
      await service.create(
        {
          ...data,
          items: [
            {
              id: 'Variant 1',
              quantity: 1,
            },
          ],
          customBulkDiscountType: 'FIXED-AMOUNT',
          customBulkDiscountFixedAmount: 50,
        },
        shiftId,
      )

      const order = await db.order.findFirst()
      const orderInvoice = await db.orderInvoice.findFirst()
      const orderItem = await db.customerOrderItem.findFirst()
      const transaction = await db.transaction.findFirst()

      expect(Number(order?.customBulkDiscount)).toBe(50)
      expect(Number(orderInvoice?.totalCardAmount)).toBe(50)
      expect(Number(orderItem?.customDiscount)).toBe(0)
      expect(Number(transaction?.amount)).toBe(50)
    })

    it('should correctly apply bulk custom discount in percentages', async () => {
      await service.create(
        {
          ...data,
          items: [
            {
              id: 'Variant 1',
              quantity: 1,
            },
          ],
          customBulkDiscountType: 'PERCENTAGE',
          customBulkDiscountPercentage: 50,
        },
        shiftId,
      )

      const order = await db.order.findFirst()
      const orderInvoice = await db.orderInvoice.findFirst()
      const orderItem = await db.customerOrderItem.findFirst()
      const transaction = await db.transaction.findFirst()

      expect(Number(order?.customBulkDiscount)).toBe(50)
      expect(Number(orderInvoice?.totalCardAmount)).toBe(50)
      expect(Number(orderItem?.customDiscount)).toBe(0)
      expect(Number(transaction?.amount)).toBe(50)
    })

    it('should correctly process an order with many items', async () => {
      await service.create(
        {
          ...data,
          items: [
            {
              id: 'Variant 1',
              quantity: 1,
            },
            {
              id: 'Variant 2',
              quantity: 1,
            },
            {
              id: 'Variant 3',
              quantity: 1,
            },
          ],
        },
        shiftId,
      )

      const orderInvoice = await db.orderInvoice.findFirst()
      const transaction = await db.transaction.findFirst()

      expect(Number(orderInvoice?.totalCardAmount)).toBe(290)
      expect(Number(transaction?.amount)).toBe(290)
    })

    it('should fail if the shift does not exist', async () => {
      await expect(service.create(data, 'non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should fail if the shift is not opened', async () => {
      await db.cashierShift.create({
        data: {
          id: 'Test Shift 2',
          name: 'Test Shift 2',
          startingCashBalance: 0,
        },
      })

      await expect(service.create(data, 'Test Shift 2')).rejects.toThrow(
        BadRequestException,
      )
    })

    it('should fail if the customer does not exist', async () => {
      await expect(
        service.create({ ...data, customerId: 'non-existent' }, shiftId),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('findAll', () => {
    beforeEach(async () => {
      await Promise.all([
        db.order.create({
          data: {
            name: 'order 1',
            shiftId,
            items: {
              create: {
                vtwId: 'Vtw 1',
                quantity: 1,
                pricePerItemWithDiscount: 10,
              },
            },
            customerId,
            createdAt: new Date(1),
          },
        }),
        db.order.create({
          data: {
            name: 'order 2',
            shift: {
              create: {
                name: 'asdf',
                startingCashBalance: 0,
              },
            },
            createdAt: new Date(10),
          },
        }),
        db.order.create({
          data: {
            name: 'order 3',
            shift: {
              create: {
                name: 'asdf',
                startingCashBalance: 0,
              },
            },
            createdAt: new Date(100),
          },
        }),
      ])
    })

    const data: FindAllOrderDto = {
      page: 1,
      rowsPerPage: 10,
      orderBy: undefined,
      query: undefined,
    }

    it('should list all orders', async () => {
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
        query: 'order 1',
      })

      expect(info.totalItems).toBe(1)
    })

    it('should filter items by warehouse id', async () => {
      const { info } = await service.findAll({
        ...data,
        warehouseIds: [warehouseId],
      })

      expect(info.totalItems).toBe(1)
    })

    it('should filter items by cashier id', async () => {
      const { info } = await service.findAll({
        ...data,
        cashierIds: [cashierId],
      })

      expect(info.totalItems).toBe(1)
    })

    it('should filter items by customer id', async () => {
      const { info } = await service.findAll({
        ...data,
        customerIds: [customerId],
      })

      expect(info.totalItems).toBe(1)
    })

    it('should filter items by pos id', async () => {
      const { info } = await service.findAll({
        ...data,
        posIds: [posId],
      })

      expect(info.totalItems).toBe(1)
    })

    it('should filter items by the date', async () => {
      const { info } = await service.findAll({
        ...data,
        date: {
          from: new Date(50).toISOString(),
          to: new Date(900).toISOString(),
        },
      })

      expect(info.totalItems).toBe(1)
    })
  })

  describe('findOne', () => {
    const id = 'Order'

    beforeEach(async () => {
      await db.order.create({
        data: {
          id,
          name: 'asdf',
          shiftId,
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
