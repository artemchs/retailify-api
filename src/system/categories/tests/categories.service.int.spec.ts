import { Test } from '@nestjs/testing'
import { DbService } from '../../../db/db.service'
import { CategoriesService } from '../categories.service'
import { AppModule } from 'src/app.module'
import { CreateCategoryDto } from '../dto/create-category.dto'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { UpdateCategoryDto } from '../dto/update-category.dto'
import {
  FindAllCategoryDto,
  FindAllInfiniteListCategoryDto,
} from '../dto/findAll-category.dto'

describe('CategoriesService', () => {
  let service: CategoriesService
  let db: DbService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    service = moduleRef.get(CategoriesService)
    db = moduleRef.get(DbService)

    await db.reset()
  })

  beforeEach(async () => {
    await db.categoryGroup.create({
      data: {
        id: 'Test Category Group 1',
        name: 'Test Category Group 1',
      },
    })
  })

  afterEach(async () => await db.reset())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    const data: CreateCategoryDto = {
      name: 'Test Category 1',
      productName: 'Test Category 1',
      groupId: 'Test Category Group 1',
    }

    it('should successfully create a new category group', async () => {
      await service.create(data)

      const categoryGroupsCount = await db.categoryGroup.count()

      expect(categoryGroupsCount).toBe(1)
    })

    it('should throw an exception if the category group does not exist', async () => {
      await expect(
        service.create({ ...data, groupId: 'non-existent' }),
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw an error if the user tries to assign a characteristic already used in the parent group', async () => {
      await db.categoryGroup.create({
        data: {
          id: 'Test Category Group 2',
          name: 'Test Category Group 2',
          characteristics: {
            create: {
              id: 'Test Characteristic 1',
              name: 'Test Characteristic 1',
            },
          },
        },
      })

      const data: CreateCategoryDto = {
        groupId: 'Test Category Group 2',
        name: 'Test Category Group 2',
        productName: 'Test Category Group 2',
        characteristics: [{ id: 'Test Characteristic 1' }],
      }

      await expect(service.create(data)).rejects.toThrow(BadRequestException)
    })
  })

  describe('findAllInfiniteList', () => {
    beforeEach(async () => {
      await db.category.createMany({
        data: [
          {
            id: 'Test Category 1',
            productName: 'Test Category 1',
            name: 'Test Category 1',
          },
          {
            id: 'Test Category 2',
            productName: 'Test Category 2',
            name: 'Test Category 2',
          },
        ],
      })
    })

    const data: FindAllInfiniteListCategoryDto = {
      cursor: undefined,
      query: undefined,
    }

    it('should list all categories', async () => {
      const { items, nextCursor } = await service.findAllInfiniteList(data)

      expect(items.length).toBe(2)
      expect(nextCursor).toBeUndefined()
    })

    it('should filter items by the name field', async () => {
      const { items } = await service.findAllInfiniteList({
        ...data,
        query: 'Test Category 1',
      })

      expect(items.length).toBe(1)
    })
  })

  describe('findAll', () => {
    beforeEach(async () => {
      await db.category.createMany({
        data: [
          {
            id: 'Test Category 1',
            name: 'Test Category 1',
            productName: 'Test Category 1',
          },
          {
            id: 'Test Category 2',
            name: 'Test Category 2',
            productName: 'Test Category 2',
          },
        ],
      })
    })

    const data: FindAllCategoryDto = {
      page: 1,
      rowsPerPage: 10,
      orderBy: undefined,
      query: undefined,
    }

    it('should list all categories', async () => {
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
        query: 'Test Category 1',
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

      expect(items[0].id).toBe('Test Category 1')
    })
  })

  describe('update', () => {
    const id = 'Test Category 1'

    beforeEach(async () => {
      await db.category.create({
        data: {
          id,
          name: id,
          groupId: 'Test Category Group 1',
          productName: id,
          characteristics: {
            create: {
              id: 'Test Characteristic 1',
              name: 'Test Characteristic 1',
            },
          },
        },
      })
    })

    const data: UpdateCategoryDto = {
      name: 'Updated Test Category 1',
    }

    it('should successfully update the requested category', async () => {
      await service.update(id, data)

      const category = await db.category.findUnique({
        where: {
          id,
        },
      })

      expect(category?.name).toBe(data.name)
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

      const category = await db.category.findUnique({
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

      expect(category?.characteristics[0].id).toBe('Test Characteristic 2')
      expect(category?.characteristics[1].id).toBe('Test Characteristic 3')
      expect(category?.characteristics.length).toBe(2)
    })

    it('should fail if the category does not exist', async () => {
      await expect(service.update('non-existent', data)).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should throw an error if the user tries to assign a characteristic already used in the parent group', async () => {
      await db.categoryGroup.create({
        data: {
          id: 'Test Category Group 2',
          name: 'Test Category Group 2',
          categories: {
            connect: {
              id,
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

      const data: CreateCategoryDto = {
        groupId: 'Test Category Group 2',
        name: 'Test Category Group 2',
        productName: 'Test Category Group 2',
        characteristics: [{ id: 'Test Characteristic 2' }],
      }

      await expect(service.create(data)).rejects.toThrow(BadRequestException)
    })
  })

  describe('archive', () => {
    const id = 'Test Category 1'

    beforeEach(async () => {
      await db.category.create({
        data: {
          id,
          name: id,
          productName: id,
        },
      })
    })

    it('should successfully archive the requested category', async () => {
      await service.archive(id)

      const category = await db.category.findUnique({
        where: {
          id,
        },
      })

      expect(category?.isArchived).toBeTruthy()
    })

    it('should fail if the category does not exist', async () => {
      await expect(service.archive('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('restore', () => {
    const id = 'Test Category 1'

    beforeEach(async () => {
      await db.category.create({
        data: {
          id,
          name: id,
          productName: id,
        },
      })
    })

    it('should successfully restore the requested category', async () => {
      await service.restore(id)

      const category = await db.category.findUnique({
        where: {
          id,
        },
      })

      expect(category?.isArchived).toBeFalsy()
    })

    it('should fail if the category does not exist', async () => {
      await expect(service.restore('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
