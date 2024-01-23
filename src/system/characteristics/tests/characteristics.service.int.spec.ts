import { Test } from '@nestjs/testing'
import { DbService } from '../../../db/db.service'
import { CharacteristicsService } from '../characteristics.service'
import { AppModule } from '../../../app.module'
import { CreateCharacteristicDto } from '../dto/create-characteristic.dto'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { UpdateCharacteristicDto } from '../dto/update-characteristic.dto'

describe('CharacteristicsService', () => {
  let service: CharacteristicsService
  let db: DbService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    service = moduleRef.get(CharacteristicsService)
    db = moduleRef.get(DbService)

    await db.reset()
  })

  afterEach(async () => await db.reset())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    const data: CreateCharacteristicDto = {
      name: 'Test Characteristic 1',
    }

    it('should successfully create a new characteristic', async () => {
      await service.create(data)

      const characteristicsCount = await db.characteristic.count()

      expect(characteristicsCount).toBe(1)
    })
  })

  describe('findAll', () => {
    beforeEach(async () => {
      await db.characteristic.createMany({
        data: [
          {
            name: 'Test Characteristic 1',
          },
          {
            name: 'Test Characteristic 2',
          },
        ],
      })
    })

    it('should list all characteristics', async () => {
      const characteristics = await service.findAll()

      expect(characteristics.length).toBe(2)
    })
  })

  describe('findOne', () => {
    beforeEach(async () => {
      await db.characteristic.create({
        data: {
          id: 'Test Characteristic 1',
          name: 'Test Characteristic 1',
        },
      })
    })

    const id = 'Test Characteristic 1'

    it('should find the requested characteristic', async () => {
      const res = await service.findOne(id)

      expect(res.id).toBe(id)
    })

    it('should throw an exception if the characteristic does not exist', async () => {
      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('update', () => {
    beforeEach(async () => {
      await db.characteristic.create({
        data: {
          id: 'Test Characteristic 1',
          name: 'Test Characteristic 1',
        },
      })
    })

    const id = 'Test Characteristic 1'

    const data: UpdateCharacteristicDto = {
      name: 'Updated Test Characteristic 1',
    }

    it('should update the requested characteristic', async () => {
      await service.update(id, data)

      const characteristic = await db.characteristic.findUnique({
        where: {
          id,
        },
      })

      expect(characteristic?.name).toBe(data.name)
    })

    it('should throw an exception if the characteristic does not exist', async () => {
      await expect(service.update('non-existent', data)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('remove', () => {
    beforeEach(async () => {
      await db.characteristic.createMany({
        data: [
          {
            id: 'Test Characteristic 1',
            name: 'Test Characteristic 1',
          },
          {
            id: 'Test Characteristic 2',
            name: 'Test Characteristic 2',
          },
        ],
      })

      await db.characteristicValue.createMany({
        data: [
          {
            id: 'Test Value 1',
            value: 'Test Value 1',
            characteristicId: 'Test Characteristic 1',
          },
          {
            id: 'Test Value 2',
            value: 'Test Value 2',
            characteristicId: 'Test Characteristic 2',
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
          characteristics: {
            connect: {
              id: 'Test Value 2',
            },
          },
        },
      })
    })

    const id = 'Test Characteristic 1'

    it('should successfully remove the requested characteristic', async () => {
      await service.remove(id)

      const characteristicsCount = await db.characteristic.count()

      expect(characteristicsCount).toBe(1)
    })

    it('should fail if the characteristic is connected to products', async () => {
      await expect(service.remove('Test Characteristic 2')).rejects.toThrow(
        BadRequestException,
      )
    })

    it('should fail if the characteristic does not exist', async () => {
      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
