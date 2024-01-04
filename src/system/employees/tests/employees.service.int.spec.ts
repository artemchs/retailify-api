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

  const data: CreateDto = {
    email: 'test@employee.com',
    fullName: 'Test Employee',
    password: 'Test Password',
  }

  it('should successfully create a new employee', async () => {
    await employeesService.create(data)

    const employeesCount = await db.systemUser.count({
      where: {
        role: 'EMPLOYEE',
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
