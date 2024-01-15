import { DbService } from 'src/db/db.service'
import { WarehousesService } from '../warehouses.service'
import { Test } from '@nestjs/testing'
import { AppModule } from 'src/app.module'
import { FindAllWarehouseDto } from '../dto/findAll-warehouse.dto'
import { NotFoundException } from '@nestjs/common'
import { UpdateWarehouseDto } from '../dto/update-warehouse.dto'

describe('WarehousesService', () => {
  let service: WarehousesService
  let db: DbService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    db = moduleRef.get(DbService)
    service = moduleRef.get(WarehousesService)

    await db.reset()
  })

  afterEach(async () => await db.reset())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should create a new warehouse', async () => {
      await service.create({
        name: 'Test Warehouse',
        address: 'address',
      })

      const warehousesCount = await db.warehouse.count()

      expect(warehousesCount).toBe(1)
    })
  })

  describe('findAll', () => {
    beforeEach(async () => {
      await db.warehouse.createMany({
        data: [
          {
            name: 'Warehouse 1',
            address: 'Warehouse Address 1',
          },
          {
            name: 'Warehouse 2',
            address: 'Warehouse Address 2',
          },
          {
            name: 'Warehouse 3',
            address: 'Warehouse Address 3',
            isArchived: true,
          },
        ],
      })
    })

    const data: FindAllWarehouseDto = {
      page: 1,
      rowsPerPage: 10,
      orderBy: undefined,
      query: undefined,
    }

    it('should list all warehouses that are not archived', async () => {
      const { items } = await service.findAll(data)

      expect(items.length).toBe(2)
    })

    it('should return correct pagination info', async () => {
      const { info } = await service.findAll(data)

      expect(info.totalItems).toBe(2)
      expect(info.totalPages).toBe(1)
    })

    it('should filter items by name query', async () => {
      const { info } = await service.findAll({ ...data, query: 'Warehouse 1' })

      expect(info.totalItems).toBe(1)
    })

    it('should filter items by address query', async () => {
      const { info } = await service.findAll({
        ...data,
        query: 'Warehouse Address 1',
      })

      expect(info.totalItems).toBe(1)
    })

    it('should get archived items', async () => {
      const { info } = await service.findAll({
        ...data,
        isArchived: 1,
      })

      expect(info.totalItems).toBe(1)
    })
  })

  describe('findOne', () => {
    beforeEach(async () => {
      await db.warehouse.create({
        data: {
          id: 'Warehouse 1',
          name: 'Warehouse 1',
          address: 'Warehouse Address 1',
        },
      })
    })

    const id = 'Warehouse 1'

    it('should find the requested warehouse', async () => {
      const res = await service.findOne(id)

      expect(res.id).toBe('Warehouse 1')
    })

    it('should throw an exception if the warehouse does not exist', async () => {
      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('update', () => {
    beforeEach(async () => {
      await db.warehouse.create({
        data: {
          id: 'Warehouse 1',
          name: 'Warehouse 1',
          address: 'Warehouse Address 1',
        },
      })
    })

    const id = 'Warehouse 1'

    const data: UpdateWarehouseDto = {
      name: 'Updated Warehouse 1',
      address: 'Warehouse Address 1',
    }

    it('should update the requested warehouse', async () => {
      await service.update(id, data)

      const warehouse = await db.warehouse.findUnique({
        where: {
          id,
        },
      })

      expect(warehouse?.name).toBe(data.name)
    })

    it('should fail if the warehouse does not exist', async () => {
      await expect(service.update('non-existent', data)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('archive', () => {
    beforeEach(async () => {
      await db.warehouse.create({
        data: {
          id: 'Warehouse 1',
          name: 'Warehouse 1',
          address: 'Warehouse Address 1',
        },
      })
    })

    const id = 'Warehouse 1'

    it('should archive the requested warehouse', async () => {
      await service.archive(id)

      const warehousesCount = await db.warehouse.count()
      const warehouse = await db.warehouse.findUnique({
        where: {
          id,
        },
      })

      expect(warehousesCount).toBe(1)
      expect(warehouse?.isArchived).toBeTruthy()
    })

    it('should fail if the warehouse does not exist', async () => {
      await expect(service.archive('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('restore', () => {
    beforeEach(async () => {
      await db.warehouse.create({
        data: {
          id: 'Warehouse 1',
          name: 'Warehouse 1',
          address: 'Warehouse Address 1',
        },
      })
    })

    const id = 'Warehouse 1'

    it('should restore the requested warehouse', async () => {
      await service.restore(id)

      const warehousesCount = await db.warehouse.count()
      const warehouse = await db.warehouse.findUnique({
        where: {
          id,
        },
      })

      expect(warehousesCount).toBe(1)
      expect(warehouse?.isArchived).toBeFalsy()
    })

    it('should fail if the warehouse does not exist', async () => {
      await expect(service.restore('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
