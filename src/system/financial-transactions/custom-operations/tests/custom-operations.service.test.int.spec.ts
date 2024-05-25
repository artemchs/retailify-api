import { DbService } from 'src/db/db.service'
import { CustomOperationsService } from '../custom-operations.service'
import { Test } from '@nestjs/testing'
import { AppModule } from 'src/app.module'
import { CreateCustomOperationDto } from '../dto/create-custom-operation.dto'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { UpdateCustomOperationDto } from '../dto/update-custom-operation.dto'

describe('CustomOperationsService', () => {
  let service: CustomOperationsService
  let db: DbService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    service = moduleRef.get(CustomOperationsService)
    db = moduleRef.get(DbService)

    await db.reset()
  })

  afterEach(async () => await db.reset())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    const data: CreateCustomOperationDto = {
      name: 'Test Operation',
    }

    it('should successfully create a new custom operation', async () => {
      await service.create(data)

      const operations = await db.customFinancialOperation.count()

      expect(operations).toBe(1)
    })
  })

  describe('findAll', () => {
    beforeEach(async () => {
      await db.customFinancialOperation.createMany({
        data: [
          {
            name: 'Test Operation 1',
          },
          {
            name: 'Test Operation 2',
          },
        ],
      })
    })

    it('should find all custom operations', async () => {
      const { items } = await service.findAll({})

      expect(items.length).toBe(2)
    })
  })

  describe('findOne', () => {
    const id = 'Test Operation 1'

    beforeEach(async () => {
      await db.customFinancialOperation.create({
        data: {
          id,
          name: id,
        },
      })
    })

    it('should find the requested custom operation', async () => {
      const data = await service.findOne(id)

      expect(data).toBeDefined()
      expect(data).not.toBeNull()
      expect(data.id).toBe(id)
    })

    it('should throw an exception if the custom operation does not exist', async () => {
      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('update', () => {
    const id = 'Test Operation 1'

    beforeEach(async () => {
      await db.customFinancialOperation.create({
        data: {
          id,
          name: id,
        },
      })
    })

    const data: UpdateCustomOperationDto = {
      name: 'Updated Test Operation 1',
    }

    it('should update the requested custom operation', async () => {
      await service.update(id, data)

      const customFinancialOperation =
        await db.customFinancialOperation.findUnique({
          where: {
            id,
          },
        })

      expect(customFinancialOperation?.name).toBe(data.name)
    })

    it('should throw an exception if the custom operation does not exist', async () => {
      await expect(service.update('non-existent', data)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('remove', () => {
    const id = 'Test Operation 1'

    beforeEach(async () => {
      await db.customFinancialOperation.create({
        data: {
          id,
          name: id,
        },
      })
    })

    it('should remove the requested custom operation', async () => {
      await service.remove(id)

      const operations = await db.customFinancialOperation.count()

      expect(operations).toBe(0)
    })

    it('should throw an exception if the custom operation does not exist', async () => {
      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should throw an exception if the custom operation is connected to transactions', async () => {
      const id = 'Test Operation 2'

      await db.customFinancialOperation.create({
        data: {
          id,
          name: id,
          transactions: {
            create: {
              amount: 1,
              direction: 'CREDIT',
              type: 'OTHER',
            },
          },
        },
      })

      await expect(service.remove(id)).rejects.toThrow(BadRequestException)
    })
  })
})
