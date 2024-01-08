import { Test } from '@nestjs/testing'
import { AppModule } from '../../../app.module'
import { DbService } from '../../../db/db.service'
import { EmployeesService } from '../employees.service'
import { CreateDto } from '../dto'
import { BadRequestException, NotFoundException } from '@nestjs/common'

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
      role: 'CASHIER',
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

  describe('find one', () => {
    beforeEach(async () => {
      await db.systemUser.create({
        data: {
          id: 'test-user',
          email: 'test@email.com',
          fullName: 'Test User',
          hash: 'hash',
        },
      })
    })

    it('should successfully get user data', async () => {
      const response = await employeesService.findOne('test-user')

      expect(response.id).toBe('test-user')
    })

    it('should throw an exception if the user does not exist', async () => {
      let error: NotFoundException | null = null

      try {
        await employeesService.findOne('non-existent')
      } catch (e) {
        error = e
      }

      expect(error).not.toBeNull()
      expect(error?.getStatus()).toBe(404)
    })
  })

  describe('update', () => {
    beforeEach(async () => {
      await Promise.all([
        db.systemUser.create({
          data: {
            id: 'test-user',
            email: 'test@email.com',
            fullName: 'Test User',
            hash: 'hash',
          },
        }),
        db.allowedSystemUserEmail.create({
          data: {
            email: 'test@email.com',
          },
        }),
      ])
    })

    it('should successfully update employee profile', async () => {
      await employeesService.update(
        {
          email: 'new@email.com',
          fullName: 'New Fullname',
          role: 'ECOMMERCE_MANAGER',
        },
        'test-user',
      )

      const updatedUser = await db.systemUser.findUnique({
        where: {
          id: 'test-user',
        },
      })

      expect(updatedUser?.email).toBe('new@email.com')
    })

    it('should update the allowed email after successfull update', async () => {
      await employeesService.update(
        {
          email: 'new@email.com',
          fullName: 'New Fullname',
          role: 'ECOMMERCE_MANAGER',
        },
        'test-user',
      )

      const allowedEmails = await db.allowedSystemUserEmail.findMany()

      expect(allowedEmails[0].email).toBe('new@email.com')
      expect(allowedEmails.length).toBe(1)
    })

    it('should throw an exception if the user does not exist', async () => {
      let error: NotFoundException | null = null

      try {
        await employeesService.update(
          {
            email: 'new@email.com',
            fullName: 'New Fullname',
            role: 'ECOMMERCE_MANAGER',
          },
          'non-existent',
        )
      } catch (e) {
        error = e
      }

      expect(error).not.toBeNull()
      expect(error?.getStatus()).toBe(404)
    })

    it('should throw an exception if the new email is already taken', async () => {
      await db.systemUser.create({
        data: {
          id: 'other-test-user',
          email: 'new@email.com',
          fullName: 'Test User',
          hash: 'hash',
        },
      })

      let error: BadRequestException | null = null

      try {
        await employeesService.update(
          {
            email: 'new@email.com',
            fullName: 'New Fullname',
            role: 'ECOMMERCE_MANAGER',
          },
          'test-user',
        )
      } catch (e) {
        error = e
      }

      expect(error).not.toBeNull()
      expect(error?.getStatus()).toBe(400)
    })
  })
})
