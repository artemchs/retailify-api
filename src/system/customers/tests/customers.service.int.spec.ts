import { DbService } from 'src/db/db.service'
import { CustomersService } from '../customers.service'
import { Test } from '@nestjs/testing'
import { AppModule } from 'src/app.module'
import { CreateCustomerDto } from '../dto/create-customer.dto'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { FindAllCustomerDto } from '../dto/findAll-customer.dto'
import { UpdateCustomerDto } from '../dto/update-customer.dto'

describe('CustomersService', () => {
  let service: CustomersService
  let db: DbService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    service = moduleRef.get(CustomersService)
    db = moduleRef.get(DbService)

    await db.reset()
  })

  afterEach(async () => await db.reset())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    const data: CreateCustomerDto = {
      email: 'john@doe.com',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '012 345 6789',
    }

    it('should create a new customer', async () => {
      await service.create(data)

      const customersCount = await db.customer.count()

      expect(customersCount).toBe(1)
    })

    it('should fail if the username is already taken', async () => {
      await db.customer.create({
        data,
      })

      await expect(service.create(data)).rejects.toThrow(BadRequestException)
    })
  })

  describe('findAllInfiniteList', () => {
    beforeEach(async () => {
      await db.customer.createMany({
        data: [
          {
            firstName: 'John',
            lastName: 'Doe',
            email: '1',
            phoneNumber: '+380 12 123 1234',
          },
          {
            firstName: 'John',
            lastName: 'Doe',
            email: '2',
            phoneNumber: '+380 12 123 1234',
          },
          {
            firstName: 'John',
            lastName: 'Doe',
            email: '3',
            phoneNumber: '+380 12 123 1234',
          },
        ],
      })
    })

    it('should list first 10 customers', async () => {
      const { items, nextCursor } = await service.findAllInfiniteList({})

      expect(items.length).toBe(3)
      expect(nextCursor).toBeUndefined
    })

    it('should filter items by the query', async () => {
      const { items } = await service.findAllInfiniteList({ query: '1' })

      expect(items.length).toBe(1)
    })
  })

  describe('findAll', () => {
    beforeEach(async () => {
      await db.customer.createMany({
        data: [
          {
            firstName: 'John',
            lastName: 'Doe',
            email: '1',
            phoneNumber: '+380 12 123 1234',
          },
          {
            firstName: 'John',
            lastName: 'Doe',
            email: '2',
            phoneNumber: '+380 12 123 1234',
          },
          {
            firstName: 'John',
            lastName: 'Doe',
            email: '3',
            phoneNumber: '+380 12 123 1234',
          },
        ],
      })
    })

    const data: FindAllCustomerDto = {
      page: 1,
      rowsPerPage: 10,
    }

    it('should list first 10 customers', async () => {
      const { items } = await service.findAll(data)

      expect(items.length).toBe(3)
    })

    it('should return correct pagination info', async () => {
      const { info } = await service.findAll(data)

      expect(info.totalItems).toBe(3)
      expect(info.totalPages).toBe(1)
    })

    it('should filter items by the query', async () => {
      const { items } = await service.findAll({ ...data, query: '1' })

      expect(items.length).toBe(1)
    })
  })

  describe('update', () => {
    const id = 'Test Customer 1'

    beforeEach(async () => {
      await db.customer.create({
        data: {
          id,
          email: id,
          firstName: id,
          lastName: id,
          phoneNumber: '+380 12 123 1234',
        },
      })
    })

    const data: UpdateCustomerDto = {
      firstName: 'New First Name',
    }

    it('should update the requested customer', async () => {
      await service.update(id, data)

      const customer = await db.customer.findUnique({
        where: {
          id,
        },
      })

      expect(customer?.firstName).toBe(data.firstName)
    })

    it('should fail if the customer does not exist', async () => {
      await expect(service.update('non-existent', data)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('remove', () => {
    const id = 'Test Customer 1'

    beforeEach(async () => {
      await db.customer.create({
        data: {
          id,
          email: id,
          firstName: id,
          lastName: id,
          phoneNumber: '+380 12 123 1234',
        },
      })
    })

    it('should remove the requested customer', async () => {
      await service.remove(id)

      const customersCount = await db.customer.count()

      expect(customersCount).toBe(0)
    })

    it('should fail if the customer does not exist', async () => {
      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
