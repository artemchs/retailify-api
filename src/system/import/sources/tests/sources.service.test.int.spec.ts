import { Test } from '@nestjs/testing'
import { DbService } from '../../../../db/db.service'
import { SourcesService } from '../sources.service'
import { AppModule } from 'src/app.module'
import { CreateSourceDto } from '../dto/create-source.dto'
import { NotFoundException } from '@nestjs/common'
import { UpdateSourceDto } from '../dto/update-source.dto'
import { ProductFields } from '../../types'

describe('ImportSourcesService', () => {
  let service: SourcesService
  let db: DbService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    service = moduleRef.get(SourcesService)
    db = moduleRef.get(DbService)

    await db.reset()
  })

  afterEach(async () => await db.reset())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    const data: CreateSourceDto = {
      name: 'Test Source 1',
      schema: [
        {
          field: ProductFields.PRODUCT_TITLE,
          incomingFileField: 'Наименование товара',
          isAdditionalField: 'false',
        },
      ],
    }

    it('should create a new import source', async () => {
      await service.create(data)

      const importSourcesCount = await db.importSource.count()

      expect(importSourcesCount).toBe(1)
    })
  })

  describe('findAll', () => {
    beforeEach(async () => {
      await db.importSource.createMany({
        data: [
          {
            name: '1C',
            schema: '',
          },
          {
            name: 'Rozetka',
            schema: '',
          },
          {
            name: 'Torgsoft',
            schema: '',
          },
        ],
      })
    })

    it('should list all import sources', async () => {
      const { items } = await service.findAll({})

      expect(items.length).toBe(3)
    })

    it('should search by the "name" field', async () => {
      const { items } = await service.findAll({
        query: 'Torgsoft',
      })

      expect(items.length).toBe(1)
    })
  })

  describe('findOne', () => {
    const id = 'Torgsoft'

    beforeEach(async () => {
      await db.importSource.create({
        data: {
          id,
          name: id,
          schema: '',
        },
      })
    })

    it('should find the requested import source', async () => {
      const res = await service.findOne(id)

      expect(res.id).toBe(id)
    })

    it('should throw an exception if the specified import source does not exist', async () => {
      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('update', () => {
    const id = 'Torgsoft'

    beforeEach(async () => {
      await db.importSource.create({
        data: {
          id,
          name: id,
          schema: '',
        },
      })
    })

    const data: UpdateSourceDto = {
      schema: [
        {
          field: ProductFields.PRODUCT_TITLE,
          incomingFileField: 'Название_позиции',
          isAdditionalField: 'false',
        },
      ],
    }

    it('should update the specified import source', async () => {
      await service.update(id, data)

      const importSource = await db.importSource.findUnique({
        where: {
          id,
        },
      })

      expect(importSource?.schema).toStrictEqual([
        {
          field: ProductFields.PRODUCT_TITLE,
          incomingFileField: 'Название_позиции',
          isAdditionalField: false,
        },
      ])
    })

    it('should throw an exception if the specified import source does not exist', async () => {
      await expect(service.update('non-existent', data)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('remove', () => {
    const id = 'Torgsoft'

    beforeEach(async () => {
      await db.importSource.create({
        data: {
          id,
          name: id,
          schema: '',
        },
      })
    })

    it('should remove the specified import source', async () => {
      await service.remove(id)

      const importSourcesCount = await db.importSource.count()

      expect(importSourcesCount).toBe(0)
    })

    it('should throw an exception if the specified import source does not exist', async () => {
      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
