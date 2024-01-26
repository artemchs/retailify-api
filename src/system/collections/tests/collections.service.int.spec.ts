import { Test } from '@nestjs/testing'
import { DbService } from '../../../db/db.service'
import { CollectionsService } from '../collections.service'
import { AppModule } from '../../../app.module'
import { CreateCollectionDto } from '../dto/create-collection.dto'
import { FindAllCollectionDto } from '../dto/findAll-collection.dto'
import { NotFoundException } from '@nestjs/common'
import { UpdateCollectionDto } from '../dto/update-collection.dto'

describe('CollectionsService', () => {
  let service: CollectionsService
  let db: DbService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    service = moduleRef.get(CollectionsService)
    db = moduleRef.get(DbService)

    await db.reset()
  })

  afterEach(async () => await db.reset())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    const data: CreateCollectionDto = {
      name: 'Test Collection 1',
    }

    it('should successfully create a new collection', async () => {
      await service.create(data)

      const collectionsCount = await db.collection.count()

      expect(collectionsCount).toBe(1)
    })

    it('should create with default characteristics', async () => {
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

      await service.create({
        ...data,
        characteristics: [
          { id: 'Test Characteristic 1' },
          { id: 'Test Characteristic 2' },
        ],
      })

      const collectionsCount = await db.collection.count()
      const collection = await db.collection.findFirst({
        include: {
          _count: {
            select: {
              characteristics: true,
            },
          },
        },
      })

      expect(collectionsCount).toBe(1)
      expect(collection?._count.characteristics).toBe(2)
    })

    it('should create a child collection', async () => {
      await db.collection.create({
        data: {
          id: 'Test Collection 1',
          name: 'Test Collection 1',
        },
      })

      await service.create({ ...data, parentId: 'Test Collection 1' })

      const collectionsCount = await db.collection.count()
      const parentCollection = await db.collection.findUnique({
        where: {
          id: 'Test Collection 1',
        },
        include: {
          children: true,
        },
      })

      expect(collectionsCount).toBe(2)
      expect(parentCollection?.parentId).toBeNull()
      expect(parentCollection?.children.length).toBe(1)
      expect(parentCollection?.children[0].parentId).toBe('Test Collection 1')
    })
  })

  describe('findAll', () => {
    beforeEach(async () => {
      await db.collection.createMany({
        data: [
          {
            id: 'Test Collection 1',
            name: 'Test Collection 1',
          },
          {
            id: 'Test Collection 2',
            name: 'Test Collection 2',
          },
          {
            id: 'Test Collection 3',
            name: 'Test Collection 3',
          },
          {
            id: 'Test Collection 4',
            name: 'Test Collection 4',
            isArchived: true,
          },
        ],
      })
    })

    const data: FindAllCollectionDto = {
      page: 1,
      rowsPerPage: 10,
      orderBy: undefined,
      query: undefined,
    }

    it('should list all colections that are not archived', async () => {
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
        query: 'Test Collection 1',
      })

      expect(info.totalItems).toBe(1)
    })

    it('should correctly order by name in ascending order', async () => {
      const { items } = await service.findAll({
        ...data,
        orderBy: {
          name: 'asc',
        },
      })

      expect(items[0].id).toBe('Test Collection 1')
    })
  })

  describe('findOne', () => {
    const id = 'Test Collection 1'

    beforeEach(async () => {
      await db.collection.create({
        data: {
          id,
          name: id,
        },
      })
    })

    it('should find the requested collection', async () => {
      const res = await service.findOne(id)

      expect(res.id).toBe(id)
    })

    it('should throw an exception if the collection does not exist', async () => {
      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('update', () => {
    const id = 'Test Collection 1'

    beforeEach(async () => {
      await db.collection.create({
        data: {
          id,
          name: id,
        },
      })
    })

    const data: UpdateCollectionDto = {
      name: 'Updated Test Collection 1',
    }

    it('should successfully update the requested collection', async () => {
      await service.update(id, data)

      const collection = await db.collection.findUnique({
        where: {
          id,
        },
      })

      expect(collection?.name).toBe(data.name)
    })

    it('should connect to characteristics', async () => {
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

      await service.update(id, {
        ...data,
        characteristics: [
          { id: 'Test Characteristic 1' },
          { id: 'Test Characteristic 2' },
        ],
      })

      const collection = await db.collection.findUnique({
        where: {
          id,
        },
        include: {
          _count: {
            select: {
              characteristics: true,
            },
          },
        },
      })
      const characteristicsCount = await db.characteristic.count()

      expect(collection?._count.characteristics).toBe(2)
      expect(characteristicsCount).toBe(2)
    })

    it('should disconnect from a characteristic', async () => {
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

      await db.collection.update({
        where: {
          id,
        },
        data: {
          characteristics: {
            connect: [
              {
                id: 'Test Characteristic 1',
              },
              {
                id: 'Test Characteristic 2',
              },
            ],
          },
        },
      })

      await service.update(id, {
        ...data,
        characteristics: [{ id: 'Test Characteristic 1' }],
      })

      const collection = await db.collection.findUnique({
        where: {
          id,
        },
        include: {
          _count: {
            select: {
              characteristics: true,
            },
          },
        },
      })
      const characteristicsCount = await db.characteristic.count()

      expect(collection?._count.characteristics).toBe(1)
      expect(characteristicsCount).toBe(2)
    })

    it('should fail if the collection does not exist', async () => {
      await expect(service.update('non-existent', data)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('archive', () => {
    const id = 'Test Collection 1'

    beforeEach(async () => {
      await db.collection.create({
        data: {
          id,
          name: id,
        },
      })
    })

    it('should successfully archive the requested collection', async () => {
      await service.archive(id)

      const collectionsCount = await db.collection.count()
      const collection = await db.collection.findUnique({
        where: {
          id,
        },
      })

      expect(collectionsCount).toBe(1)
      expect(collection?.isArchived).toBeTruthy()
    })

    it('should fail if the requested collection does not exist', async () => {
      await expect(service.archive('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('restore', () => {
    const id = 'Test Collection 1'

    beforeEach(async () => {
      await db.collection.create({
        data: {
          id,
          name: id,
        },
      })
    })

    it('should successfully restore the requested collection', async () => {
      await service.restore(id)

      const collectionsCount = await db.collection.count()
      const collection = await db.collection.findUnique({
        where: {
          id,
        },
      })

      expect(collectionsCount).toBe(1)
      expect(collection?.isArchived).toBeFalsy()
    })

    it('should fail if the requested collection does not exist', async () => {
      await expect(service.restore('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
