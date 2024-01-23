import { DbService } from 'src/db/db.service'
import { VariantsService } from '../variants.service'
import { Test } from '@nestjs/testing'
import { AppModule } from 'src/app.module'
import { CreateVariantDto } from '../dto/create-variant.dto'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { FindAllVariantDto } from '../dto/findAll-variant.dto'
import { UpdateVariantDto } from '../dto/update-variant.dto'

describe('VariantsService', () => {
  let service: VariantsService
  let db: DbService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    db = moduleRef.get(DbService)
    service = moduleRef.get(VariantsService)

    await db.reset()
  })

  afterEach(async () => await db.reset())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  const productId = 'Test Product 1'

  beforeEach(async () => {
    await db.product.create({
      data: {
        id: productId,
        title: productId,
        description: productId,
        packagingHeight: 0,
        packagingLength: 0,
        packagingWeight: 0,
        packagingWidth: 0,
      },
    })
  })

  describe('create', () => {
    const data: CreateVariantDto = {
      price: 59.99,
      size: 'XL',
      sku: '12345',
    }

    it('should successfully create a new variant', async () => {
      await service.create(productId, data)

      const variantsCount = await db.variant.count()
      const product = await db.product.findUnique({
        where: {
          id: productId,
        },
        include: {
          variants: true,
        },
      })

      expect(variantsCount).toBe(1)
      expect(product?.variants.length).toBe(1)
    })

    it('should fail if the sku is already taken', async () => {
      await db.variant.create({
        data: {
          productId,
          price: 1,
          size: 'XL',
          sku: '12345',
          totalReceivedQuantity: 0,
          totalWarehouseQuantity: 0,
        },
      })

      await expect(service.create(productId, data)).rejects.toThrow(
        BadRequestException,
      )
    })
  })

  describe('findAll', () => {
    beforeEach(async () => {
      await db.variant.createMany({
        data: [
          {
            productId,
            price: 1,
            size: 'XL',
            sku: '1',
            totalReceivedQuantity: 1,
            totalWarehouseQuantity: 1,
          },
          {
            productId,
            price: 1,
            size: 'XL',
            sku: '12',
            totalReceivedQuantity: 2,
            totalWarehouseQuantity: 2,
          },
          {
            productId,
            price: 1,
            size: 'XL',
            sku: '123',
            totalReceivedQuantity: 3,
            totalWarehouseQuantity: 3,
          },
          {
            productId,
            price: 1,
            size: 'XL',
            sku: '1234',
            totalReceivedQuantity: 4,
            totalWarehouseQuantity: 4,
            isArchived: true,
          },
        ],
      })
    })

    const data: FindAllVariantDto = {
      page: 1,
      rowsPerPage: 10,
      orderBy: undefined,
      query: undefined,
    }

    it('should list all variants that are not archived', async () => {
      const { items } = await service.findAll(data)

      expect(items.length).toBe(3)
    })

    it('should return correct pagination info', async () => {
      const { info } = await service.findAll(data)

      expect(info.totalItems).toBe(3)
      expect(info.totalPages).toBe(1)
    })

    it('should filter items by sku query', async () => {
      const { info } = await service.findAll({
        ...data,
        query: '123',
      })

      expect(info.totalItems).toBe(1)
    })
  })

  describe('findOne', () => {
    const id = 'Test Variant 1'

    beforeEach(async () => {
      await db.variant.create({
        data: {
          productId,
          id,
          price: 1,
          size: 'XL',
          sku: '12345',
          totalReceivedQuantity: 0,
          totalWarehouseQuantity: 0,
        },
      })
    })

    it('should find the requested variant', async () => {
      const res = await service.findOne(id)

      expect(res.id).toBe(id)
    })

    it('should throw an exception if the variant does not exist', async () => {
      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('update', () => {
    const id = 'Test Variant 1'

    beforeEach(async () => {
      await db.variant.create({
        data: {
          productId,
          id,
          price: 1,
          size: 'XL',
          sku: '12345',
          totalReceivedQuantity: 0,
          totalWarehouseQuantity: 0,
        },
      })
    })

    const data: UpdateVariantDto = {
      size: 'SM',
    }

    it('should successfully update the requested variant', async () => {
      await service.update(productId, id, data)

      const variant = await db.variant.findUnique({
        where: {
          id,
        },
      })

      expect(variant?.size).toBe(data.size)
    })

    it('should fail if the variant does not exist', async () => {
      await expect(
        service.update(productId, 'non-existent', data),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('archive', () => {
    const id = 'Test Variant 1'

    beforeEach(async () => {
      await db.variant.create({
        data: {
          productId,
          id,
          price: 1,
          size: 'XL',
          sku: '12345',
          totalReceivedQuantity: 0,
          totalWarehouseQuantity: 0,
        },
      })
    })

    it('should successfully archive the requested variant', async () => {
      await service.archive(id)

      const variantsCount = await db.variant.count()
      const variant = await db.variant.findUnique({
        where: {
          id,
        },
      })

      expect(variantsCount).toBe(1)
      expect(variant?.isArchived).toBeTruthy()
    })

    it('should fail if the requested variant does not exist', async () => {
      await expect(service.archive('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('restore', () => {
    const id = 'Test Variant 1'

    beforeEach(async () => {
      await db.variant.create({
        data: {
          productId,
          id,
          price: 1,
          size: 'XL',
          sku: '12345',
          totalReceivedQuantity: 0,
          totalWarehouseQuantity: 0,
        },
      })
    })

    it('should successfully restore the requested variant', async () => {
      await service.restore(id)

      const variantsCount = await db.variant.count()
      const variant = await db.variant.findUnique({
        where: {
          id,
        },
      })

      expect(variantsCount).toBe(1)
      expect(variant?.isArchived).toBeFalsy()
    })

    it('should fail if the requested variant does not exist', async () => {
      await expect(service.restore('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
