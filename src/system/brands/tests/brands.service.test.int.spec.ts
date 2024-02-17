import { Test } from '@nestjs/testing'
import { BrandsService } from '../brands.service'
import { DbService } from 'src/db/db.service'
import { AppModule } from 'src/app.module'
import { CreateBrandDto } from '../dto/create-brand.dto'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { UpdateBrandDto } from '../dto/update-brand.dto'

describe('BrandsService', () => {
  let service: BrandsService
  let db: DbService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    service = moduleRef.get(BrandsService)
    db = moduleRef.get(DbService)

    await db.reset()
  })

  afterEach(async () => await db.reset())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    const data: CreateBrandDto = {
      name: 'Test Brand 1',
    }

    it('should successfully create a new brand', async () => {
      await service.create(data)

      const brandsCount = await db.brand.count()

      expect(brandsCount).toBe(1)
    })
  })

  describe('findAll', () => {
    beforeEach(async () => {
      await db.brand.createMany({
        data: [
          {
            name: 'Test Brand 1',
          },
          {
            name: 'Test Brand 2',
          },
        ],
      })
    })

    it('should list all brands', async () => {
      const brands = await service.findAll({})

      expect(brands.items.length).toBe(2)
    })
  })

  describe('findOne', () => {
    const id = 'Test Brand 1'

    beforeEach(async () => {
      await db.brand.create({
        data: {
          id,
          name: id,
        },
      })
    })

    it('should find the requested brand', async () => {
      const res = await service.findOne(id)

      expect(res.id).toBe(id)
    })

    it('should throw an exception if the brand does not exist', async () => {
      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('update', () => {
    const id = 'Test Brand 1'

    beforeEach(async () => {
      await db.brand.create({
        data: {
          id,
          name: id,
        },
      })
      await db.product.create({
        data: {
          id: 'Test Product 1',
          title: 'Test Product 1',
          gender: 'UNISEX',
          packagingHeight: 1,
          packagingLength: 1,
          packagingWeight: 1,
          packagingWidth: 1,
          season: 'ALL_SEASON',
          sku: 'TE__',
          brandId: id,
        },
      })
    })

    const data: UpdateBrandDto = {
      name: 'Updated Test Brand 1',
    }

    it('should update the requested brand', async () => {
      await service.update(id, data)

      const brand = await db.brand.findUnique({
        where: {
          id,
        },
      })

      expect(brand?.name).toBe(data.name)
    })

    it('should correctly update the connected product SKUs', async () => {
      await service.update(id, data)

      const product = await db.product.findUnique({
        where: {
          id: 'Test Product 1',
        },
      })

      expect(product?.sku).toBe('UP__')
    })

    it('should throw an exception if the brand does not exist', async () => {
      await expect(service.update('non-existent', data)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('remove', () => {
    beforeEach(async () => {
      await db.brand.createMany({
        data: [
          {
            id: 'Test Brand 1',
            name: 'Test Brand 1',
          },
          {
            id: 'Test Brand 2',
            name: 'Test Brand 2',
          },
        ],
      })

      await db.product.create({
        data: {
          id: 'Test Product 1',
          title: 'Test Product 1',
          description: 'Test Product 1',
          packagingHeight: 10,
          packagingLength: 10,
          packagingWeight: 10,
          packagingWidth: 10,
          brandId: 'Test Brand 2',
          gender: 'UNISEX',
          season: 'ALL_SEASON',
          sku: '1',
        },
      })
    })

    it('should successfully remove the requested brand', async () => {
      await service.remove('Test Brand 1')

      const brandsCount = await db.brand.count()

      expect(brandsCount).toBe(1)
    })

    it('should fail if the brand is connected to products', async () => {
      await expect(service.remove('Test Brand 2')).rejects.toThrow(
        BadRequestException,
      )
    })

    it('should fail if the brand does not exist', async () => {
      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
