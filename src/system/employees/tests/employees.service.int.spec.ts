import { Test } from '@nestjs/testing'
import { AppModule } from '../../../app.module'
import { DbService } from '../../../db/db.service'
import { EmployeesService } from '../employees.service'
import { CreateDto } from '../dto'
import { BadRequestException } from '@nestjs/common'

describe('EmployeesService (int)', () => {
  let db: DbService
  let employeesService: EmployeesService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    db = moduleRef.get(DbService)
    employeesService = moduleRef.get(EmployeesService)

    await db.reset()
  })

  afterEach(async () => await db.reset())

  describe('create', () => {
    const data: CreateDto = {
      email: 'test@employee.com',
      fullName: 'Test Employee',
      password: 'Test Password',
    }

    it('should successfully create a new employee', async () => {
      await employeesService.create(data)

      const employeesCount = await db.systemUser.count({
        where: {
          role: {
            in: ['CASHIER', 'ECOMMERCE_MANAGER'],
          },
        },
      })

      expect(employeesCount).toBe(1)
    })

    it('should throw an exception if a user with this email already exists', async () => {
      await employeesService.create(data)

      let error: BadRequestException | null = null

      try {
        await employeesService.create(data)
      } catch (e) {
        error = e
      }

      expect(error).not.toBeNull()
      expect(error?.getStatus()).toBe(400)
    })
  })

  describe('find all', () => {
    beforeEach(async () => {
      await db.systemUser.createMany({
        data: [
          {
            email: 'cashier@user.com',
            fullName: 'Cashier',
            role: 'CASHIER',
            hash: 'hash',
          },
          {
            email: 'ecommerce-manager@user.com',
            fullName: 'Ecommerce manager',
            role: 'ECOMMERCE_MANAGER',
            hash: 'hash',
          },
        ],
      })
    })

    it('should successfully list all users', async () => {
      const response = await employeesService.findAll({
        page: 1,
        rowsPerPage: 10,
      })

      expect(response.items.length).toBe(2)
    })

    describe('info', () => {
      it('should return correct pagination info', async () => {
        const response = await employeesService.findAll({
          page: 1,
          rowsPerPage: 10,
        })

        expect(response.info.totalItems).toBe(2)
        expect(response.info.totalPages).toBe(1)
      })
    })

    describe('filter', () => {
      describe('by role', () => {
        it('should correctly filter employees by their role', async () => {
          const cashiers = await employeesService.findAll({
            page: 1,
            rowsPerPage: 10,
            roles: ['CASHIER'],
          })
          const ecommerceManagers = await employeesService.findAll({
            page: 1,
            rowsPerPage: 10,
            roles: ['ECOMMERCE_MANAGER'],
          })

          expect(cashiers.items.length).toBe(1)
          expect(ecommerceManagers.items.length).toBe(1)
        })
      })
    })

    describe('order by', () => {
      it('should correctly order employees by single field', async () => {
        const { items } = await employeesService.findAll({
          page: 1,
          rowsPerPage: 10,
          orderBy: {
            fullName: 'asc',
          },
        })

        expect(items[0].fullName).toBe('Cashier')
      })

      it('should correctly order employees by multiple fields', async () => {
        const { items } = await employeesService.findAll({
          page: 1,
          rowsPerPage: 10,
          orderBy: {
            email: 'asc',
            fullName: 'asc',
          },
        })

        expect(items[0].fullName).toBe('Cashier')
      })
    })

    describe('query', () => {
      it('should be able to filter employees by query', async () => {
        const { items } = await employeesService.findAll({
          page: 1,
          rowsPerPage: 10,
          query: 'cashier@user.com',
        })

        expect(items.length).toBe(1)
      })
    })
  })
})
