import { Test } from '@nestjs/testing'
import { DbService } from '../../../db/db.service'
import { CategoryGroupsService } from '../category-groups.service'
import { AppModule } from 'src/app.module'
import { CreateCategoryGroupDto } from '../dto/create-category-group.dto'
import {
  FindAllCategoryGroupDto,
  FindAllInfiniteListCategoryGroupDto,
} from '../dto/findAll-category-group-dto'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { UpdateCategoryGroupDto } from '../dto/update-category-group.dto'

describe('CategoryGroupsService', () => {
  let service: CategoryGroupsService
  let db: DbService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    service = moduleRef.get(CategoryGroupsService)
    db = moduleRef.get(DbService)

    await db.reset()
  })

  afterEach(async () => await db.reset())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    const data: CreateCategoryGroupDto = {
      name: 'Test Category Group 1',
    }

    it('should successfully create a new category group', async () => {
      await service.create(data)

      const categoryGroupsCount = await db.categoryGroup.count()

      expect(categoryGroupsCount).toBe(1)
    })
  })

  describe('findAllInfiniteList', () => {
    beforeEach(async () => {
      await db.categoryGroup.createMany({
        data: [
          {
            id: 'Test Category Group 1',
            name: 'Test Category Group 1',
          },
          {
            id: 'Test Category Group 2',
            name: 'Test Category Group 2',
          },
        ],
      })
    })

    const data: FindAllInfiniteListCategoryGroupDto = {
      cursor: undefined,
      query: undefined,
    }

    it('should list all category groups', async () => {
      const { items, nextCursor } = await service.findAllInfiniteList(data)

      expect(items.length).toBe(2)
      expect(nextCursor).toBeUndefined()
    })

    it('should filter items by the name field', async () => {
      const { items } = await service.findAllInfiniteList({
        ...data,
        query: 'Test Category Group 1',
      })

      expect(items.length).toBe(1)
    })
  })

  describe('findAll', () => {
    beforeEach(async () => {
      await db.categoryGroup.createMany({
        data: [
          {
            id: 'Test Category Group 1',
            name: 'Test Category Group 1',
          },
          {
            id: 'Test Category Group 2',
            name: 'Test Category Group 2',
          },
        ],
      })
    })

    const data: FindAllCategoryGroupDto = {
      page: 1,
      rowsPerPage: 10,
      orderBy: undefined,
      query: undefined,
    }

    it('should list all category groups', async () => {
      const { items } = await service.findAll(data)

      expect(items.length).toBe(2)
    })

    it('should return correct pagination info', async () => {
      const { info } = await service.findAll(data)

      expect(info.totalItems).toBe(2)
      expect(info.totalPages).toBe(1)
    })

    it('should filter items by name query', async () => {
      const { info } = await service.findAll({
        ...data,
        query: 'Test Category Group 1',
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

      expect(items[0].id).toBe('Test Category Group 1')
    })
  })

  describe('findOne', () => {
    const id = 'Test Category Group 1'

    beforeEach(async () => {
      await db.categoryGroup.create({
        data: {
          id,
          name: id,
        },
      })
    })

    it('should find the requested category group', async () => {
      const res = await service.findOne(id)

      expect(res.id).toBe(id)
    })

    it('should throw an exception if the category group does not exist', async () => {
      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('update', () => {
    const id = 'Test Category Group 1'

    beforeEach(async () => {
      await db.categoryGroup.create({
        data: {
          id,
          name: id,
          characteristics: {
            create: {
              id: 'Test Characteristic 1',
              name: 'Test Characteristic 1',
            },
          },
        },
      })
    })

    const data: UpdateCategoryGroupDto = {
      name: 'Updated Category Group 1',
    }

    it('should successfully update the requested category group', async () => {
      await service.update(id, data)

      const categoryGroup = await db.categoryGroup.findUnique({
        where: {
          id,
        },
      })

      expect(categoryGroup?.name).toBe(data.name)
    })

    it('should update connected characteristics', async () => {
      await db.characteristic.createMany({
        data: [
          {
            id: 'Test Characteristic 2',
            name: 'Test Characteristic 2',
          },
          {
            id: 'Test Characteristic 3',
            name: 'Test Characteristic 3',
          },
        ],
      })

      await service.update(id, {
        ...data,
        characteristics: [
          {
            id: 'Test Characteristic 2',
          },
          {
            id: 'Test Characteristic 3',
          },
        ],
      })

      const categoryGroup = await db.categoryGroup.findUnique({
        where: {
          id,
        },
        include: {
          characteristics: {
            orderBy: {
              id: 'asc',
            },
          },
        },
      })

      expect(categoryGroup?.characteristics[0].id).toBe('Test Characteristic 2')
      expect(categoryGroup?.characteristics[1].id).toBe('Test Characteristic 3')
      expect(categoryGroup?.characteristics.length).toBe(2)
    })

    it('should fail if the category group does not exist', async () => {
      await expect(service.update('non-existent', data)).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should throw an error if the user tries to assign a characteristic already used in the child category', async () => {
      await db.categoryGroup.create({
        data: {
          id: 'Test Category Group 2',
          name: 'Test Category Group 2',
          categories: {
            create: {
              id: 'Test Category 2',
              name: 'Test Category 2',
              productName: 'Test Category 2',
              characteristics: {
                create: {
                  id: 'Test Characteristic 3',
                  name: 'Test Characteristic 3',
                },
              },
            },
          },
          characteristics: {
            create: {
              id: 'Test Characteristic 2',
              name: 'Test Characteristic 2',
            },
          },
        },
      })

      const data: UpdateCategoryGroupDto = {
        characteristics: [
          {
            id: 'Test Characteristic 2',
          },
          {
            id: 'Test Characteristic 3',
          },
        ],
      }

      await expect(
        service.update('Test Category Group 2', data),
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('archive', () => {
    const id = 'Test Category Group 1'

    beforeEach(async () => {
      await db.categoryGroup.create({
        data: {
          id,
          name: id,
        },
      })
    })

    it('should successfully archive the requested category group', async () => {
      await service.archive(id)

      const categoryGroup = await db.categoryGroup.findUnique({
        where: {
          id,
        },
      })

      expect(categoryGroup?.isArchived).toBeTruthy()
    })

    it('should fail if the category group does not exist', async () => {
      await expect(service.archive('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('restore', () => {
    const id = 'Test Category Group 1'

    beforeEach(async () => {
      await db.categoryGroup.create({
        data: {
          id,
          name: id,
        },
      })
    })

    it('should successfully restore the requested category group', async () => {
      await service.restore(id)

      const categoryGroup = await db.categoryGroup.findUnique({
        where: {
          id,
        },
      })

      expect(categoryGroup?.isArchived).toBeFalsy()
    })

    it('should fail if the category group does not exist', async () => {
      await expect(service.restore('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
