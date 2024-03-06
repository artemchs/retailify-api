import { DbService } from 'src/db/db.service'
import { PointsOfSaleService } from '../points-of-sale.service'
import { Test } from '@nestjs/testing'
import { AppModule } from 'src/app.module'
import { CreatePointsOfSaleDto } from '../dto/create-points-of-sale.dto'
import { FindAllPointsOfSaleDto } from '../dto/findAll-points-of-sale.dto'
import { NotFoundException } from '@nestjs/common'
import { UpdatePointsOfSaleDto } from '../dto/update-points-of-sale.dto'

describe('PointsOfSaleService', () => {
  let service: PointsOfSaleService
  let db: DbService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    db = moduleRef.get(DbService)
    service = moduleRef.get(PointsOfSaleService)

    await db.reset()
  })

  beforeEach(async () => {
    await db.systemUser.create({
      data: {
        id: 'Cashier 1',
        email: 'cashier@1.com',
        fullName: 'Cashier 1',
        hash: '12345',
      },
    })
    await db.warehouse.create({
      data: {
        id: 'Test Warehouse 1',
        address: 'Test Warehouse 1',
        name: 'Test Warehouse 1',
      },
    })
  })

  afterEach(async () => await db.reset())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    const data: CreatePointsOfSaleDto = {
      name: 'Test POS 1',
      address: 'Test Address',
      warehouseId: 'Test Warehouse 1',
      cashiers: [
        {
          id: 'Cashier 1',
        },
      ],
    }

    it('should create a new POS', async () => {
      await service.create(data)

      const pointsOfSaleCount = await db.pointOfSale.count()

      expect(pointsOfSaleCount).toBe(1)
    })
  })

  describe('findAll', () => {
    beforeEach(async () => {
      await Promise.all([
        db.pointOfSale.create({
          data: {
            name: 'POS 1',
            address: 'test 1',
            cashiers: {
              connect: {
                id: 'Cashier 1',
              },
            },
            productTags: {
              create: {
                id: 'Tag 1',
                name: 'Tag 1',
              },
            },
          },
        }),
        db.pointOfSale.create({
          data: {
            name: 'POS 2',
            address: 'test',
            categories: {
              create: {
                id: 'Category 1',
                name: 'Category 1',
                productName: 'Category 1',
              },
            },
          },
        }),
        db.pointOfSale.create({
          data: {
            name: 'POS 3',
            address: 'test',
            categoryGroups: {
              create: {
                id: 'Category Group 1',
                name: 'Category Group 1',
              },
            },
          },
        }),
        db.pointOfSale.create({
          data: {
            name: 'POS 4',
            address: 'test',
            isArchived: true,
          },
        }),
      ])
    })

    const data: FindAllPointsOfSaleDto = {
      page: 1,
      rowsPerPage: 10,
      orderBy: undefined,
      query: undefined,
    }

    it('should list all points of sale', async () => {
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
        query: 'POS 1',
      })

      expect(info.totalItems).toBe(1)
    })

    it('should filter items by address query', async () => {
      const { info } = await service.findAll({
        ...data,
        query: 'test 1',
      })

      expect(info.totalItems).toBe(1)
    })

    it('should filter items by isArchived status', async () => {
      const { info } = await service.findAll({ ...data, isArchived: 1 })

      expect(info.totalItems).toBe(1)
    })

    it('should filter items by product tag id', async () => {
      const { info } = await service.findAll({
        ...data,
        productTagIds: ['Tag 1'],
      })

      expect(info.totalItems).toBe(1)
    })

    it('should filter items by category id', async () => {
      const { info } = await service.findAll({
        ...data,
        categoryIds: ['Category 1'],
      })

      expect(info.totalItems).toBe(1)
    })

    it('should filter items by category group id', async () => {
      const { info } = await service.findAll({
        ...data,
        categoryGroupIds: ['Category Group 1'],
      })

      expect(info.totalItems).toBe(1)
    })

    it('should filter items by cashier id', async () => {
      const { info } = await service.findAll({
        ...data,
        cashierIds: ['Cashier 1'],
      })

      expect(info.totalItems).toBe(1)
    })
  })

  describe('findOne', () => {
    const id = 'Test POS 1'

    beforeEach(async () => {
      await db.pointOfSale.create({
        data: {
          id,
          address: id,
          name: id,
        },
      })
    })

    it('should find the requested POS', async () => {
      const data = await service.findOne(id)

      expect(data.id).toBe(id)
    })

    it('should fail if the POS does not exist', async () => {
      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('update', () => {
    const id = 'Test POS 1'

    beforeEach(async () => {
      await db.pointOfSale.create({
        data: {
          id,
          address: id,
          name: id,
        },
      })
    })

    const data: UpdatePointsOfSaleDto = {
      name: 'Updated POS 1',
    }

    it('should update the POS', async () => {
      await service.update(id, data)

      const pos = await db.pointOfSale.findUnique({
        where: {
          id,
        },
      })

      expect(pos?.name).toBe(data.name)
    })

    it('should fail if the POS does not exist', async () => {
      await expect(service.update('non-existent', data)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('archive', () => {
    const id = 'Test POS 1'

    beforeEach(async () => {
      await db.pointOfSale.create({
        data: {
          id,
          address: id,
          name: id,
        },
      })
    })

    it('should archive the requested POS', async () => {
      await service.archive(id)

      const pos = await db.pointOfSale.findUnique({
        where: {
          id,
        },
      })

      expect(pos?.isArchived).toBeTruthy()
    })

    it('should fail if the POS does not exist', async () => {
      await expect(service.archive('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('restore', () => {
    const id = 'Test POS 1'

    beforeEach(async () => {
      await db.pointOfSale.create({
        data: {
          id,
          address: id,
          name: id,
        },
      })
    })

    it('should restore the requested POS', async () => {
      await service.restore(id)

      const pos = await db.pointOfSale.findUnique({
        where: {
          id,
        },
      })

      expect(pos?.isArchived).toBeFalsy()
    })

    it('should fail if the POS does not exist', async () => {
      await expect(service.restore('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
