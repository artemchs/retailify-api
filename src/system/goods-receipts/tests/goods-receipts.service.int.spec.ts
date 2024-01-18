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
    await db.supplier.create({
      data: {
        id: 'test-supplier',
        name: 'Test Supplier 1',
        address: 'Test Supplier Address',
        contactPerson: 'Test Supplier Contact Person',
        email: 'Test Supplier Email',
        phone: 'Test Supplier Phone',
      },
    })
  })

  describe('create', () => {
    const data: CreateGoodsReceiptDto = {
      goodsReceiptDate: new Date(),
      paymentOption: 'PRIVATE_FUNDS',
      paymentTerm: 'PAYMENT_IN_ADVANCE',
      supplierId: 'test-supplier',
    }

    it('should successfully create a new goods receipt', async () => {
      await service.create(data)

      const goodsReceiptsCount = await db.goodsReceipt.count()

      expect(goodsReceiptsCount).toBe(1)
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
            isArchived: true,
          },
          {
            name: 'Goods Receipt 2',
            goodsReceiptDate: new Date(2022),
            supplierId: 'test-supplier',
          },
          {
            name: 'Goods Receipt 3',
            goodsReceiptDate: new Date(2023),
            supplierId: 'test-supplier',
          },
          {
            name: 'Goods Receipt 4',
            goodsReceiptDate: new Date(2024),
            supplierId: 'test-supplier',
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

    it('should list all suppliers that are not archived', async () => {
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
        query: 'Goods Receipt 4',
      })

      expect(info.totalItems).toBe(1)
    })

    it('should get archived items', async () => {
      const { info } = await service.findAll({
        ...data,
        isArchived: 1,
      })

      expect(info.totalItems).toBe(1)
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
      await db.goodsReceipt.create({
        data: {
          id: 'Goods Receipt 1',
          name: 'Goods Receipt 1',
          goodsReceiptDate: new Date(),
          supplierInvoice: {
            create: {
              accountsPayable: 0,
              paymentOption: 'CASH_REGISTER',
              paymentTerm: 'CASH_ON_DELIVERY',
            },
          },
        },
      })
    })

    const id = 'Goods Receipt 1'

    const data: UpdateGoodsReceiptDto = {
      goodsReceiptDate: new Date(2024),
      paymentOption: 'CASH_REGISTER',
      paymentTerm: 'CASH_ON_DELIVERY',
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

    it('should fail if the goods receipt does not exist', async () => {
      await expect(service.update('non-existent', data)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('archive', () => {
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

    it('should successfully archive the requested goods receipt', async () => {
      await service.archive(id)

      const goodsReceiptsCount = await db.goodsReceipt.count()
      const goodsReceipt = await db.goodsReceipt.findUnique({
        where: {
          id,
        },
      })

      expect(goodsReceiptsCount).toBe(1)
      expect(goodsReceipt?.isArchived).toBeTruthy()
    })

    it('should fail if the goods receipt does not exist', async () => {
      await expect(service.archive('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('restore', () => {
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

    it('should successfully restore the requested goods receipt', async () => {
      await service.restore(id)

      const goodsReceiptsCount = await db.goodsReceipt.count()
      const goodsReceipt = await db.goodsReceipt.findUnique({
        where: {
          id,
        },
      })

      expect(goodsReceiptsCount).toBe(1)
      expect(goodsReceipt?.isArchived).toBeFalsy()
    })

    it('should fail if the goods receipt does not exist', async () => {
      await expect(service.restore('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
