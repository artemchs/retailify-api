import { DbService } from 'src/db/db.service'
import { ProductTagsService } from '../product-tags.service'
import { Test } from '@nestjs/testing'
import { AppModule } from 'src/app.module'
import { CreateProductTagDto } from '../dto/create-product-tag.dto'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { UpdateProductTagDto } from '../dto/update-product-tag.dto'

describe('ProductTagsService', () => {
  let service: ProductTagsService
  let db: DbService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    service = moduleRef.get(ProductTagsService)
    db = moduleRef.get(DbService)

    await db.reset()
  })

  afterEach(async () => await db.reset())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    const data: CreateProductTagDto = {
      name: 'Test Tag 1',
    }

    it('should create a new product tag', async () => {
      await service.create(data)

      const tagsCount = await db.productTag.count()

      expect(tagsCount).toBe(1)
    })
  })

  describe('findAll', () => {
    beforeEach(async () => {
      await db.productTag.createMany({
        data: [
          {
            name: 'Test Tag 1',
          },
          {
            name: 'Test Tag 2',
          },
        ],
      })
    })

    it('should list all tags', async () => {
      const tags = await service.findAll({})

      expect(tags.items.length).toBe(2)
    })
  })

  describe('findOne', () => {
    const id = 'Test Tag 1'

    beforeEach(async () => {
      await db.productTag.create({
        data: {
          id,
          name: id,
        },
      })
    })

    it('should find the requested tag', async () => {
      const data = await service.findOne(id)

      expect(data.id).toBe(id)
    })

    it('should throw an exception if the tag does not exist', async () => {
      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('update', () => {
    const id = 'Test Tag 1'

    beforeEach(async () => {
      await db.productTag.create({
        data: {
          id,
          name: id,
        },
      })
    })

    const data: UpdateProductTagDto = {
      name: 'Updated Tag 1',
    }

    it('should update the requested tag', async () => {
      await service.update(id, data)

      const tag = await db.productTag.findUnique({
        where: {
          id,
        },
      })

      expect(tag?.name).toBe(data.name)
    })

    it('should throw an exception if the tag does not exist', async () => {
      await expect(service.update('non-existent', data)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('remove', () => {
    const id = 'Test Tag 1'

    beforeEach(async () => {
      await db.productTag.create({
        data: {
          id,
          name: id,
        },
      })
    })

    it('should successfully remove the requested tag', async () => {
      await service.remove(id)

      const brandsCount = await db.productTag.count()

      expect(brandsCount).toBe(0)
    })

    it('should fail if the tag is connected to products', async () => {
      await db.product.create({
        data: {
          id: 'Test Product 1',
          title: 'Test Product 1',
          description: 'Test Product 1',
          packagingHeight: 10,
          packagingLength: 10,
          packagingWeight: 10,
          packagingWidth: 10,
          gender: 'UNISEX',
          season: 'ALL_SEASON',
          sku: '1',
          tags: {
            connect: {
              id,
            },
          },
        },
      })

      await expect(service.remove(id)).rejects.toThrow(BadRequestException)
    })

    it('should fail if the tag does not exist', async () => {
      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
