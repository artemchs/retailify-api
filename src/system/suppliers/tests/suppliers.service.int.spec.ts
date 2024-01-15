import { Test } from '@nestjs/testing'
import { SuppliersService } from '../suppliers.service'
import { DbService } from 'src/db/db.service'
import { CreateSupplierDto } from '../dto/create-supplier.dto'
import { FindAllSupplierDto } from '../dto/findAll-supplier.dto'
import { NotFoundException } from '@nestjs/common'
import { UpdateSupplierDto } from '../dto/update-supplier.dto'
import { AppModule } from 'src/app.module'

describe('SuppliersService', () => {
  let service: SuppliersService
  let db: DbService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    db = moduleRef.get(DbService)
    service = moduleRef.get(SuppliersService)

    await db.reset()
  })

  afterEach(async () => await db.reset())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    const data: CreateSupplierDto = {
      name: 'New Supplier',
      address: 'address',
      contactPerson: 'person',
      email: 'email',
      phone: 'phone',
    }

    it('should successfully create a new supplier', async () => {
      await service.create(data)

      const suppliersCount = await db.supplier.count()

      expect(suppliersCount).toBe(1)
    })
  })

  describe('findAll', () => {
    beforeEach(async () => {
      await db.supplier.createMany({
        data: [
          {
            name: 'Supplier 1',
            address: 'Supplier Address 1',
            contactPerson: 'Supplier Contact Person 1',
            email: 'Supplier Email 1',
            phone: 'Supplier Phone 1',
          },
          {
            name: 'Supplier 2',
            address: 'Supplier Address 2',
            contactPerson: 'Supplier Contact Person 2',
            email: 'Supplier Email 2',
            phone: 'Supplier Phone 2',
          },
          {
            name: 'Supplier 3',
            address: 'Supplier Address 3',
            contactPerson: 'Supplier Contact Person 3',
            email: 'Supplier Email 3',
            phone: 'Supplier Phone 3',
          },
          {
            name: 'Supplier 4',
            address: 'Supplier Address 4',
            contactPerson: 'Supplier Contact Person 4',
            email: 'Supplier Email 4',
            phone: 'Supplier Phone 4',
          },
          {
            name: 'Deleted Supplier 5',
            address: 'Deleted Supplier Address 5',
            contactPerson: 'Deleted Supplier Contact Person 5',
            email: 'Deleted Supplier Email 5',
            phone: 'Deleted Supplier Phone 5',
            isArchived: true,
          },
        ],
      })
    })

    const data: FindAllSupplierDto = {
      page: 1,
      rowsPerPage: 10,
      orderBy: undefined,
      query: undefined,
    }

    it('should list all suppliers that are not archived', async () => {
      const { items } = await service.findAll(data)

      expect(items.length).toBe(4)
    })

    it('should return correct pagination info', async () => {
      const { info } = await service.findAll(data)

      expect(info.totalItems).toBe(4)
      expect(info.totalPages).toBe(1)
    })

    it('should filter items by name query', async () => {
      const { info } = await service.findAll({ ...data, query: 'Supplier 1' })

      expect(info.totalItems).toBe(1)
    })

    it('should filter items by address query', async () => {
      const { info } = await service.findAll({
        ...data,
        query: 'Supplier Address 1',
      })

      expect(info.totalItems).toBe(1)
    })

    it('should filter items by contact person query', async () => {
      const { info } = await service.findAll({
        ...data,
        query: 'Supplier Contact Person 1',
      })

      expect(info.totalItems).toBe(1)
    })

    it('should filter items by email query', async () => {
      const { info } = await service.findAll({
        ...data,
        query: 'Supplier Email 1',
      })

      expect(info.totalItems).toBe(1)
    })

    it('should filter items by phone number query', async () => {
      const { info } = await service.findAll({
        ...data,
        query: 'Supplier Phone 1',
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
      await db.supplier.create({
        data: {
          id: 'Supplier 1',
          name: 'Supplier 1',
          address: 'Supplier Address 1',
          contactPerson: 'Supplier Contact Person 1',
          email: 'Supplier Email 1',
          phone: 'Supplier Phone 1',
        },
      })
    })

    const id = 'Supplier 1'

    it('should find the requested supplier', async () => {
      const res = await service.findOne(id)

      expect(res.id).toBe('Supplier 1')
    })

    it('should throw an exception if the supplier does not exist', async () => {
      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('update', () => {
    beforeEach(async () => {
      await db.supplier.create({
        data: {
          id: 'Supplier 1',
          name: 'Supplier 1',
          address: 'Supplier Address 1',
          contactPerson: 'Supplier Contact Person 1',
          email: 'Supplier Email 1',
          phone: 'Supplier Phone 1',
        },
      })
    })

    const id = 'Supplier 1'

    const data: UpdateSupplierDto = {
      name: 'Updated Supplier 1',
      address: 'Supplier Address 1',
      contactPerson: 'Supplier Contact Person 1',
      email: 'Supplier Email 1',
      phone: 'Supplier Phone 1',
    }

    it('should update the requested supplier', async () => {
      await service.update(id, data)

      const supplier = await db.supplier.findUnique({
        where: {
          id,
        },
      })

      expect(supplier?.name).toBe(data.name)
    })

    it('should fail if the supplier does not exist', async () => {
      await expect(service.update('non-existent', data)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('archive', () => {
    beforeEach(async () => {
      await db.supplier.create({
        data: {
          id: 'Supplier 1',
          name: 'Supplier 1',
          address: 'Supplier Address 1',
          contactPerson: 'Supplier Contact Person 1',
          email: 'Supplier Email 1',
          phone: 'Supplier Phone 1',
        },
      })
    })

    const id = 'Supplier 1'

    it('should archive the requested supplier', async () => {
      await service.archive(id)

      const suppliersCount = await db.supplier.count()
      const supplier = await db.supplier.findUnique({
        where: {
          id,
        },
      })

      expect(suppliersCount).toBe(1)
      expect(supplier?.isArchived).toBeTruthy()
    })

    it('should fail if the supplier does not exist', async () => {
      await expect(service.archive('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('restore', () => {
    beforeEach(async () => {
      await db.supplier.create({
        data: {
          id: 'Supplier 1',
          name: 'Supplier 1',
          address: 'Supplier Address 1',
          contactPerson: 'Supplier Contact Person 1',
          email: 'Supplier Email 1',
          phone: 'Supplier Phone 1',
          isArchived: true,
        },
      })
    })

    const id = 'Supplier 1'

    it('should restore the requested supplier', async () => {
      await service.restore(id)

      const suppliersCount = await db.supplier.count()
      const supplier = await db.supplier.findUnique({
        where: {
          id,
        },
      })

      expect(suppliersCount).toBe(1)
      expect(supplier?.isArchived).toBeFalsy()
    })

    it('should fail if the supplier does not exist', async () => {
      await expect(service.restore('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
