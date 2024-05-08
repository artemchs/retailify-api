import { DbService } from 'src/db/db.service'
import { GoodsReceiptsService } from '../goods-receipts.service'
import { AppModule } from 'src/app.module'
import { Test } from '@nestjs/testing'
import { CreateGoodsReceiptDto } from '../dto/create-goods-receipt.dto'
import { NotFoundException } from '@nestjs/common'
import { FindAllGoodsReceiptDto } from '../dto/findAll-goods-receipt.dto'
import { UpdateGoodsReceiptDto } from '../dto/update-goods-receipt.dto'

describe('GoodsReceiptsService', () => {
  let service: GoodsReceiptsService
  let db: DbService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    db = moduleRef.get(DbService)
    service = moduleRef.get(GoodsReceiptsService)

    await db.reset()
  })

  afterEach(async () => await db.reset())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  beforeEach(async () => {
    await db.product.create({
      data: {
        id: 'Test Product 1',
        title: 'Test Product 1',
        description: 'Test Product 1',
        packagingHeight: 10,
        packagingLength: 10,
        packagingWeight: 10,
        packagingWidth: 10,
        totalReceivedQuantity: 10,
        totalWarehouseQuantity: 10,
        gender: 'UNISEX',
        season: 'ALL_SEASON',
        sku: '1',
      },
    })

    await Promise.all([
      db.supplier.createMany({
        data: [
          {
            id: 'test-supplier',
            name: 'Test Supplier 1',
            address: 'Test Supplier Address',
            contactPerson: 'Test Supplier Contact Person',
            email: 'Test Supplier Email',
            phone: 'Test Supplier Phone',
          },
          {
            id: 'test-supplier-2',
            name: 'Test Supplier 2',
            address: 'Test Supplier Address',
            contactPerson: 'Test Supplier Contact Person',
            email: 'Test Supplier Email',
            phone: 'Test Supplier Phone',
          },
        ],
      }),
      db.warehouse.createMany({
        data: [
          {
            id: 'Test Warehouse 1',
            name: 'Test Warehouse 1',
            address: 'Test Warehouse 1',
          },
          {
            id: 'Test Warehouse 2',
            name: 'Test Warehouse 2',
            address: 'Test Warehouse 2',
          },
        ],
      }),
      db.variant.createMany({
        data: [
          {
            id: 'Test Variant 1',
            price: 100,
            size: 'SM',
            totalReceivedQuantity: 0,
            totalWarehouseQuantity: 0,
            productId: 'Test Product 1',
            barcode: 'asdf',
          },
          {
            id: 'Test Variant 2',
            price: 200,
            size: 'XL',
            totalReceivedQuantity: 10,
            totalWarehouseQuantity: 10,
            productId: 'Test Product 1',
            barcode: 'asdf1',
          },
        ],
      }),
    ])

    db.goodsReceipt.create({
      data: {
        goodsReceiptDate: new Date(),
        name: 'Test Goods Receipt',
        productVariants: {
          create: {
            receivedQuantity: 10,
            supplierPrice: 10,
            variantId: 'Test Variant 2  ',
          },
        },
      },
    })
  })

  describe('create', () => {
    const data: CreateGoodsReceiptDto = {
      goodsReceiptDate: new Date(),
      paymentOption: 'PRIVATE_FUNDS',
      supplierId: 'test-supplier',
      warehouseId: 'Test Warehouse 1',
      variants: [],
    }

    it('should successfully create a new goods receipt', async () => {
      await service.create(data)

      const goodsReceiptsCount = await db.goodsReceipt.count()

      expect(goodsReceiptsCount).toBe(1)
    })

    it('should create new VariationToWarehouse entities', async () => {
      await service.create({
        ...data,
        variants: [
          {
            variantId: 'Test Variant 1',
            receivedQuantity: 10,
            supplierPrice: 10,
          },
        ],
      })

      const vtwsCount = await db.variantToWarehouse.count()
      const vtw = await db.variantToWarehouse.findFirst({
        where: {
          variantId: 'Test Variant 1',
        },
      })

      expect(vtwsCount).toBe(1)
      expect(vtw?.warehouseQuantity).toBe(10)
    })

    it('should update VariantToWarehouse entities if they exist', async () => {
      await db.variantToWarehouse.create({
        data: {
          warehouseId: 'Test Warehouse 1',
          variantId: 'Test Variant 1',
          warehouseQuantity: 10,
        },
      })

      await service.create({
        ...data,
        variants: [
          {
            variantId: 'Test Variant 1',
            receivedQuantity: 10,
            supplierPrice: 10,
          },
        ],
      })

      const vtwsCount = await db.variantToWarehouse.count()
      const vtw = await db.variantToWarehouse.findFirst({
        where: {
          variantId: 'Test Variant 1',
        },
      })

      expect(vtwsCount).toBe(1)
      expect(vtw?.warehouseQuantity).toBe(20)
    })

    it('should correctly update quantities', async () => {
      await service.create({
        ...data,
        variants: [
          {
            variantId: 'Test Variant 1',
            receivedQuantity: 10,
            supplierPrice: 10,
          },
          {
            variantId: 'Test Variant 2',
            receivedQuantity: 10,
            supplierPrice: 10,
          },
        ],
      })

      const variant1 = await db.variant.findUnique({
        where: {
          id: 'Test Variant 1',
        },
        include: {
          goodsReceiptEntries: true,
          warehouseStockEntries: true,
        },
      })
      const variant2 = await db.variant.findUnique({
        where: {
          id: 'Test Variant 2',
        },
        include: {
          goodsReceiptEntries: true,
          warehouseStockEntries: true,
        },
      })
      const product = await db.product.findUnique({
        where: {
          id: 'Test Product 1',
        },
      })

      expect(variant1?.totalReceivedQuantity).toBe(10)
      expect(variant1?.totalWarehouseQuantity).toBe(10)
      expect(variant1?.goodsReceiptEntries[0].receivedQuantity).toBe(10)
      expect(variant1?.warehouseStockEntries[0].warehouseQuantity).toBe(10)
      expect(variant2?.totalReceivedQuantity).toBe(20)
      expect(variant2?.totalWarehouseQuantity).toBe(20)
      expect(variant2?.goodsReceiptEntries[0].receivedQuantity).toBe(10)
      expect(variant2?.warehouseStockEntries[0].warehouseQuantity).toBe(10)
      expect(product?.totalReceivedQuantity).toBe(30)
      expect(product?.totalWarehouseQuantity).toBe(30)
    })

    it('should create new VariantToGoodsReceipt entities', async () => {
      await service.create({
        ...data,
        variants: [
          {
            variantId: 'Test Variant 1',
            receivedQuantity: 10,
            supplierPrice: 10,
          },
        ],
      })

      const variantsToGoodsReceiptCount = await db.variantToGoodsReceipt.count()
      const variantToGoodsReceipt = await db.variantToGoodsReceipt.findFirst()

      expect(variantsToGoodsReceiptCount).toBe(1)
      expect(variantToGoodsReceipt?.receivedQuantity).toBe(10)
      expect(Number(variantToGoodsReceipt?.supplierPrice)).toBe(10)
    })

    it('should correctly create the supplier invoice', async () => {
      await service.create({
        ...data,
        variants: [
          {
            variantId: 'Test Variant 1',
            receivedQuantity: 10,
            supplierPrice: 50, // total - $500
          },
          {
            variantId: 'Test Variant 2',
            receivedQuantity: 5,
            supplierPrice: 10, // total - $50
          },
        ],
      })

      const supplierInvoicesCount = await db.supplierInvoice.count()
      const supplierInvoice = await db.supplierInvoice.findFirst()

      expect(supplierInvoicesCount).toBe(1)
      expect(Number(supplierInvoice?.accountsPayable)).toBe(550)
      expect(supplierInvoice?.paymentOption).toBe('PRIVATE_FUNDS')
    })

    it('should correctly update selling prices of variants', async () => {
      await service.create({
        ...data,
        variants: [
          {
            variantId: 'Test Variant 1',
            receivedQuantity: 10,
            supplierPrice: 50,
            sellingPrice: 12345,
          },
        ],
      })

      const variant = await db.variant.findUnique({
        where: {
          id: 'Test Variant 1',
        },
      })

      expect(Number(variant?.price)).toBe(12345)
    })

    it('should throw an exception if the supplier does not exist', async () => {
      await expect(
        service.create({ ...data, supplierId: 'non-existent' }),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('findAll', () => {
    beforeEach(async () => {
      await db.goodsReceipt.createMany({
        data: [
          {
            name: 'Goods Receipt 1',
            goodsReceiptDate: new Date(2021),
            supplierId: 'test-supplier',
            warehouseId: 'Test Warehouse 1',
          },
          {
            name: 'Goods Receipt 2',
            goodsReceiptDate: new Date(2022),
            supplierId: 'test-supplier',
            warehouseId: 'Test Warehouse 2',
          },
          {
            name: 'Goods Receipt 3',
            goodsReceiptDate: new Date(2023),
            supplierId: 'test-supplier-2',
            warehouseId: 'Test Warehouse 2',
          },
          {
            name: 'Goods Receipt 4',
            goodsReceiptDate: new Date(2024),
            supplierId: 'test-supplier',
            isArchived: true,
          },
        ],
      })
    })

    const data: FindAllGoodsReceiptDto = {
      page: 1,
      rowsPerPage: 10,
      orderBy: undefined,
      query: undefined,
    }

    it('should list all goods receipts', async () => {
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
        query: 'Goods Receipt 1',
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

    it('should filter items by supplier id', async () => {
      const { info } = await service.findAll({
        ...data,
        supplierIds: ['test-supplier-2'],
      })

      expect(info.totalItems).toBe(1)
    })

    it('should filter items by goods receipt date', async () => {
      const { info } = await service.findAll({
        ...data,
        goodsReceiptDate: {
          from: new Date(2021).toISOString(),
          to: new Date(2022).toISOString(),
        },
      })

      expect(info.totalItems).toBe(2)
    })
  })

  describe('findOne', () => {
    beforeEach(async () => {
      await db.goodsReceipt.create({
        data: {
          id: 'Goods Receipt 1',
          name: 'Goods Receipt 1',
          goodsReceiptDate: new Date(),
        },
      })
    })

    const id = 'Goods Receipt 1'

    it('should find the requested goods receipt', async () => {
      const res = await service.findOne(id)

      expect(res.id).toBe(id)
    })

    it('should throw an exception if the goods receipt does not exist', async () => {
      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('update', () => {
    beforeEach(async () => {
      await Promise.all([
        db.goodsReceipt.create({
          data: {
            id: 'Goods Receipt 1',
            name: 'Goods Receipt 1',
            goodsReceiptDate: new Date(),
            supplierInvoice: {
              create: {
                accountsPayable: 100,
                paymentOption: 'CASH_REGISTER',
              },
            },
            productVariants: {
              create: {
                receivedQuantity: 10,
                supplierPrice: 10,
                variantId: 'Test Variant 1',
              },
            },
          },
        }),
        db.variantToWarehouse.createMany({
          data: {
            warehouseQuantity: 10,
            variantId: 'Test Variant 1',
            warehouseId: 'Test Warehouse 1',
          },
        }),
        db.variant.update({
          where: {
            id: 'Test Variant 1',
          },
          data: {
            totalReceivedQuantity: 10,
            totalWarehouseQuantity: 10,
          },
        }),
        db.product.update({
          where: {
            id: 'Test Product 1',
          },
          data: {
            totalReceivedQuantity: 20,
            totalWarehouseQuantity: 20,
          },
        }),
      ])
    })

    const id = 'Goods Receipt 1'

    const data: UpdateGoodsReceiptDto = {
      goodsReceiptDate: new Date(2024),
      paymentOption: 'CASH_REGISTER',
      warehouseId: 'Test Warehouse 1',
      supplierId: 'test-supplier',
    }

    it('should successfully update the requested goods receipt', async () => {
      await service.update(id, data)

      const goodsReceipt = await db.goodsReceipt.findUnique({
        where: {
          id,
        },
        include: {
          supplierInvoice: true,
        },
      })

      expect(goodsReceipt?.supplierInvoice?.paymentOption).toBe('CASH_REGISTER')
    })

    it('should create new VariantToGoodsReceipt and VariantToWarehouse entities', async () => {
      await service.update(id, {
        ...data,
        variants: [
          {
            variantId: 'Test Variant 1',
            receivedQuantity: 10,
            supplierPrice: 10,
          },
          {
            variantId: 'Test Variant 2',
            receivedQuantity: 5,
            supplierPrice: 5,
          },
        ],
      })

      const variantsToWarehouseCount = await db.variantToWarehouse.count()
      const variantsToGoodsReceiptCount = await db.variantToGoodsReceipt.count()
      const variantToWarehouse2 = await db.variantToWarehouse.findFirst({
        where: {
          variantId: 'Test Variant 2',
        },
      })
      const variantToGoodsReceipt2 = await db.variantToGoodsReceipt.findFirst({
        where: {
          variantId: 'Test Variant 2',
        },
      })

      expect(variantsToWarehouseCount).toBe(2)
      expect(variantsToGoodsReceiptCount).toBe(2)
      expect(variantToWarehouse2?.warehouseQuantity).toBe(5)
      expect(variantToGoodsReceipt2?.receivedQuantity).toBe(5)
      expect(Number(variantToGoodsReceipt2?.supplierPrice)).toBe(5)
    })

    it('should correctly update the supplier invoice', async () => {
      await service.update(id, {
        ...data,
        variants: [
          {
            variantId: 'Test Variant 1',
            receivedQuantity: 10,
            supplierPrice: 10,
          },
          {
            variantId: 'Test Variant 2',
            receivedQuantity: 10,
            supplierPrice: 5,
          },
        ],
      })

      const supplierInvoicesCount = await db.supplierInvoice.count()
      const supplierInvoice = await db.supplierInvoice.findFirst()

      expect(supplierInvoicesCount).toBe(1)
      expect(Number(supplierInvoice?.accountsPayable)).toBe(150)
    })

    it('should correctly update quantities', async () => {
      await service.update(id, {
        ...data,
        variants: [
          {
            variantId: 'Test Variant 1',
            receivedQuantity: 20,
            supplierPrice: 10,
          },
          {
            variantId: 'Test Variant 2',
            receivedQuantity: 10,
            supplierPrice: 5,
          },
        ],
      })

      const variant1 = await db.variant.findUnique({
        where: {
          id: 'Test Variant 1',
        },
        include: {
          goodsReceiptEntries: true,
          warehouseStockEntries: true,
        },
      })
      const variant2 = await db.variant.findUnique({
        where: {
          id: 'Test Variant 2',
        },
        include: {
          goodsReceiptEntries: true,
          warehouseStockEntries: true,
        },
      })
      const product = await db.product.findUnique({
        where: {
          id: 'Test Product 1',
        },
      })

      expect(variant1?.totalReceivedQuantity).toBe(20)
      expect(variant1?.totalWarehouseQuantity).toBe(20)
      expect(variant2?.totalReceivedQuantity).toBe(10)
      expect(variant2?.totalWarehouseQuantity).toBe(10)
      expect(product?.totalReceivedQuantity).toBe(30)
      expect(product?.totalWarehouseQuantity).toBe(30)
    })

    it('should remove a variation from the list', async () => {
      await service.update(id, {
        ...data,
        variants: [
          {
            variantId: 'Test Variant 2',
            receivedQuantity: 10,
            supplierPrice: 5,
          },
        ],
      })

      const variant1 = await db.variant.findUnique({
        where: {
          id: 'Test Variant 1',
        },
      })
      const product = await db.product.findUnique({
        where: {
          id: 'Test Product 1',
        },
      })
      const supplierInvoice = await db.supplierInvoice.findFirst()

      expect(variant1?.totalReceivedQuantity).toBe(0)
      expect(variant1?.totalWarehouseQuantity).toBe(0)
      expect(product?.totalReceivedQuantity).toBe(10)
      expect(product?.totalWarehouseQuantity).toBe(10)
      expect(Number(supplierInvoice?.accountsPayable)).toBe(50)
    })

    it('should correctly update selling prices of variants', async () => {
      await service.update(id, {
        ...data,
        variants: [
          {
            variantId: 'Test Variant 1',
            receivedQuantity: 10,
            supplierPrice: 50,
            sellingPrice: 12345,
          },
        ],
      })

      const variant = await db.variant.findUnique({
        where: {
          id: 'Test Variant 1',
        },
      })

      expect(Number(variant?.price)).toBe(12345)
    })

    it('should fail if the goods receipt does not exist', async () => {
      await expect(service.update('non-existent', data)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('archive', () => {
    beforeEach(async () => {
      await Promise.all([
        db.goodsReceipt.create({
          data: {
            id: 'Goods Receipt 1',
            name: 'Goods Receipt 1',
            goodsReceiptDate: new Date(),
            supplierInvoice: {
              create: {
                accountsPayable: 100,
                paymentOption: 'CASH_REGISTER',
              },
            },
            productVariants: {
              create: {
                receivedQuantity: 10,
                supplierPrice: 10,
                variantId: 'Test Variant 1',
              },
            },
          },
        }),
        db.variantToWarehouse.create({
          data: {
            id: 'Test Vtw 1',
            warehouseQuantity: 10,
            variantId: 'Test Variant 1',
            warehouseId: 'Test Warehouse 1',
          },
        }),
        db.variant.update({
          where: {
            id: 'Test Variant 1',
          },
          data: {
            totalReceivedQuantity: 10,
            totalWarehouseQuantity: 10,
          },
        }),
        db.product.update({
          where: {
            id: 'Test Product 1',
          },
          data: {
            totalReceivedQuantity: 20,
            totalWarehouseQuantity: 20,
          },
        }),
      ])
    })

    it('should archive the goods receipt', async () => {
      await service.archive('Goods Receipt 1')

      const goodsReceipt = await db.goodsReceipt.findUnique({
        where: {
          id: 'Goods Receipt 1',
        },
      })

      expect(goodsReceipt?.isArchived).toBeTruthy()
    })

    it('should correctly decrement quantities from variants', async () => {
      await service.archive('Goods Receipt 1')

      const vtw = await db.variantToWarehouse.findUnique({
        where: {
          id: 'Test Vtw 1',
        },
      })
      const variant = await db.variant.findUnique({
        where: {
          id: 'Test Variant 1',
        },
      })
      const product = await db.product.findUnique({
        where: {
          id: 'Test Product 1',
        },
      })

      expect(vtw?.warehouseQuantity).toBe(0)
      expect(variant?.totalReceivedQuantity).toBe(0)
      expect(variant?.totalWarehouseQuantity).toBe(0)
      expect(product?.totalReceivedQuantity).toBe(10)
      expect(product?.totalWarehouseQuantity).toBe(10)
    })

    it('should fail if the goods receipt does not exist', async () => {
      await expect(service.archive('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('restore', () => {
    beforeEach(async () => {
      await Promise.all([
        db.goodsReceipt.create({
          data: {
            id: 'Goods Receipt 1',
            name: 'Goods Receipt 1',
            goodsReceiptDate: new Date(),
            supplierInvoice: {
              create: {
                accountsPayable: 100,
                paymentOption: 'CASH_REGISTER',
              },
            },
            productVariants: {
              create: {
                receivedQuantity: 10,
                supplierPrice: 10,
                variantId: 'Test Variant 1',
              },
            },
            isArchived: true,
          },
        }),
        db.variantToWarehouse.create({
          data: {
            id: 'Test Vtw 1',
            warehouseQuantity: 0,
            variantId: 'Test Variant 1',
            warehouseId: 'Test Warehouse 1',
          },
        }),
        db.variant.update({
          where: {
            id: 'Test Variant 1',
          },
          data: {
            totalReceivedQuantity: 0,
            totalWarehouseQuantity: 0,
          },
        }),
        db.product.update({
          where: {
            id: 'Test Product 1',
          },
          data: {
            totalReceivedQuantity: 10,
            totalWarehouseQuantity: 10,
          },
        }),
      ])
    })

    it('should restore the goods receipt', async () => {
      await service.restore('Goods Receipt 1')

      const goodsReceipt = await db.goodsReceipt.findUnique({
        where: {
          id: 'Goods Receipt 1',
        },
      })

      expect(goodsReceipt?.isArchived).toBeFalsy()
    })

    it('should correctly update variant quantities', async () => {
      await service.restore('Goods Receipt 1')

      const vtw = await db.variantToWarehouse.findUnique({
        where: {
          id: 'Test Vtw 1',
        },
      })
      const variant = await db.variant.findUnique({
        where: {
          id: 'Test Variant 1',
        },
      })
      const product = await db.product.findUnique({
        where: {
          id: 'Test Product 1',
        },
      })

      expect(vtw?.warehouseQuantity).toBe(10)
      expect(variant?.totalReceivedQuantity).toBe(10)
      expect(variant?.totalWarehouseQuantity).toBe(10)
      expect(product?.totalReceivedQuantity).toBe(20)
      expect(product?.totalWarehouseQuantity).toBe(20)
    })

    it('should fail if the goods receipt does not exist', async () => {
      await expect(service.restore('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
