import { Test } from '@nestjs/testing'
import { DbService } from '../../../../db/db.service'
import { ValuesService } from '../values.service'
import { AppModule } from '../../../../app.module'
import { CreateValueDto } from '../dto/create-value.dto'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { UpdateValueDto } from '../dto/update-value.dto'

describe('CharacteristicValuesService', () => {
  let service: ValuesService
  let db: DbService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    service = moduleRef.get(ValuesService)
    db = moduleRef.get(DbService)

    await db.reset()
  })

  afterEach(async () => await db.reset())

  const characteristicId = 'Test Characteristic 1'

  beforeEach(async () => {
    await db.characteristic.create({
      data: {
        id: characteristicId,
        name: characteristicId,
      },
    })
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    const data: CreateValueDto = {
      value: 'Test Value 1',
    }

    it('should successfully create a new value', async () => {
      await service.create(characteristicId, data)

      const valuesCount = await db.characteristicValue.count()

      expect(valuesCount).toBe(1)
    })
  })

  describe('findAll', () => {
    beforeEach(async () => {
      await db.characteristicValue.createMany({
        data: [
          {
            value: 'Test Value 1',
            characteristicId,
          },
          {
            value: 'Test Value 2',
            characteristicId,
          },
        ],
      })
    })

    it('should list all values', async () => {
      const values = await service.findAll({}, characteristicId)

      expect(values.items.length).toBe(2)
    })
  })

  describe('findOne', () => {
    const id = 'Test Value 1'

    beforeEach(async () => {
      await db.characteristicValue.create({
        data: {
          id,
          value: id,
          characteristicId,
        },
      })
    })

    it('should find the requested value', async () => {
      const res = await service.findOne(characteristicId, id)

      expect(res.id).toBe(id)
    })

    it('should throw an exception if the characteristic does not exist', async () => {
      await expect(service.findOne('non-existent', id)).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should throw an exception if the value does not exist', async () => {
      await expect(
        service.findOne(characteristicId, 'non-existent'),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    const id = 'Test Value 1'

    beforeEach(async () => {
      await db.characteristicValue.create({
        data: {
          id,
          value: id,
          characteristicId,
        },
      })
    })

    const data: UpdateValueDto = {
      value: `Updated ${id}`,
    }

    it('should update the requested value', async () => {
      await service.update(characteristicId, id, data)

      const value = await db.characteristicValue.findUnique({
        where: {
          id,
        },
      })

      expect(value?.value).toBe(data.value)
    })

    it('should throw an exception if the characteristic does not exist', async () => {
      await expect(service.update('non-existent', id, data)).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should throw an exception if the value does not exist', async () => {
      await expect(
        service.update(characteristicId, 'non-existent', data),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('remove', () => {
    beforeEach(async () => {
      await db.characteristic.create({
        data: {
          id: 'Test Characteristic 2',
          name: 'Test Characteristic 2',
        },
      }) // 'Test Characteristic 1' is created in the top level beforeEach

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
          characteristicValues: {
            connect: {
              id: 'Test Value 2',
            },
          },
          gender: 'UNISEX',
          season: 'ALL_SEASON',
          sku: '12345',
        },
      })
    })

    const id = 'Test Value 1'

    it('should successfully remove the requeested value', async () => {
      await service.remove(characteristicId, id)

      const valuesCount = await db.characteristicValue.count()

      expect(valuesCount).toBe(1)
    })

    it('should fail if the characteristic is connected to products', async () => {
      await expect(
        service.remove('Test Characteristic 2', 'Test Value 2'),
      ).rejects.toThrow(BadRequestException)
    })

    it('should fail if the characteristic does not exist', async () => {
      await expect(service.remove('non-existent', id)).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should fail if the value does not exist', async () => {
      await expect(
        service.remove('Test Characteristic 1', 'non-existent'),
      ).rejects.toThrow(NotFoundException)
    })
  })
})
