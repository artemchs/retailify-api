import { Test } from '@nestjs/testing'
import { DbService } from '../../../db/db.service'
import { ColorsService } from '../colors.service'
import { AppModule } from '../../../app.module'
import { CreateColorDto } from '../dto/create-color.dto'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { UpdateColorDto } from '../dto/update-color.dto'

describe('ColorsService', () => {
  let service: ColorsService
  let db: DbService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    service = moduleRef.get(ColorsService)
    db = moduleRef.get(DbService)

    await db.reset()
  })

  afterEach(async () => await db.reset())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    const data: CreateColorDto = {
      name: 'Test Color 1',
      color: 'Test Color 1',
    }

    it('should successfully create a new color', async () => {
      await service.create(data)

      const colorsCount = await db.color.count()

      expect(colorsCount).toBe(1)
    })
  })

  describe('findAll', () => {
    beforeEach(async () => {
      await db.color.createMany({
        data: [
          {
            name: 'Test Color 1',
            color: 'Test Color 1',
          },
          {
            name: 'Test Color 2',
            color: 'Test Color 2',
          },
        ],
      })
    })

    it('should list all colors', async () => {
      const colors = await service.findAll({})

      expect(colors.items.length).toBe(2)
    })
  })

  describe('findOne', () => {
    beforeEach(async () => {
      await db.color.create({
        data: {
          id: 'Test Color 1',
          name: 'Test Color 1',
          color: 'Test Color 1',
        },
      })
    })

    const id = 'Test Color 1'

    it('should find the requested color', async () => {
      const res = await service.findOne(id)

      expect(res.id).toBe(id)
    })

    it('should throw an exception if the color does not exist', async () => {
      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('update', () => {
    const id = 'Test Color 1'

    beforeEach(async () => {
      await db.color.create({
        data: {
          id,
          name: id,
          color: id,
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
          sku: '____TE__',
          colors: {
            create: {
              index: 0,
              colorId: id,
            },
          },
        },
      })
    })

    const data: UpdateColorDto = {
      name: 'Updated Color 1',
    }

    it('should update the requested color', async () => {
      await service.update(id, data)

      const color = await db.color.findUnique({
        where: {
          id,
        },
      })

      expect(color?.name).toBe(data.name)
    })

    it('should throw an exception if the color does not exist', async () => {
      await expect(service.update('non-existent', data)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('remove', () => {
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
          gender: 'UNISEX',
          season: 'ALL_SEASON',
          sku: '1',
        },
      })

      await db.color.createMany({
        data: [
          {
            id: 'Test Color 1',
            name: 'Test Color 1',
            color: 'Test Color 1',
          },
          {
            id: 'Test Color 2',
            name: 'Test Color 2',
            color: 'Test Color 2',
          },
        ],
      })

      await db.productToColor.create({
        data: {
          colorId: 'Test Color 2',
          index: 0,
          productId: 'Test Product 1',
        },
      })
    })

    const id = 'Test Color 1'

    it('should successfully remove the requested color', async () => {
      await service.remove(id)

      const colorsCount = await db.color.count()

      expect(colorsCount).toBe(1)
    })

    it('should fail if the color is connected to products', async () => {
      await expect(service.remove('Test Color 2')).rejects.toThrow(
        BadRequestException,
      )
    })

    it('should fail if the color does not exist', async () => {
      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
