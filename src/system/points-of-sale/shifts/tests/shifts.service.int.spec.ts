import { DbService } from 'src/db/db.service'
import { ShiftsService } from '../shifts.service'
import { Test } from '@nestjs/testing'
import { AppModule } from 'src/app.module'
import { FindAllShiftDto } from '../dto/findAll-shifts.dto'
import { CreateShiftDto } from '../dto/create-shift.dto'
import { NotFoundException } from '@nestjs/common'
import { UpdateShiftDto } from '../dto/update-shift.dto'

describe('CashierShiftsService', () => {
  let service: ShiftsService
  let db: DbService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    db = moduleRef.get(DbService)
    service = moduleRef.get(ShiftsService)

    await db.reset()
  })

  afterEach(async () => await db.reset())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  beforeEach(async () => {
    await Promise.all([
      db.systemUser.create({
        data: {
          id: 'Test User 1',
          email: 'test@user.com',
          fullName: 'Test User 1',
          hash: '12345',
        },
      }),
      db.warehouse.create({
        data: {
          id: 'Test Warehouse 1',
          address: 'Test Warehouse 1',
          name: 'Test Warehouse 1',
        },
      }),
    ])
    await db.pointOfSale.create({
      data: {
        id: 'Test POS 1',
        address: 'test',
        name: 'Test POS 1',
        cashiers: {
          connect: {
            id: 'Test User 1',
          },
        },
        warehouseId: 'Test Warehouse 1',
      },
    })
  })

  const posId = 'Test POS 1'
  const userId = 'Test User 1'

  describe('create', () => {
    const data: CreateShiftDto = {
      startingCashBalance: 100,
    }

    it('should create a new shift', async () => {
      await service.create(userId, posId, data)

      const shift = await db.cashierShift.findFirst()

      expect(shift?.cashierId).toBe(userId)
      expect(shift?.pointOfSaleId).toBe(posId)
      expect(Number(shift?.startingCashBalance)).toBe(data.startingCashBalance)
    })

    it('should fail if the user does not exist', async () => {
      await expect(service.create('non-existent', posId, data)).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should fail if the POS does not exist', async () => {
      await expect(
        service.create(userId, 'non-existent', data),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('findOne', () => {
    const id = 'Test Shift 1'

    beforeEach(async () => {
      await db.cashierShift.create({
        data: {
          id,
          name: id,
          startingCashBalance: 100,
        },
      })
    })

    it('should find a shift', async () => {
      const data = await service.findOne(id)

      expect(data.id).toBe(id)
    })

    it('should fail if the shift does not exist', async () => {
      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('findAll', () => {
    beforeEach(async () => {
      await db.cashierShift.createMany({
        data: [
          {
            name: 'Shift 1',
            startingCashBalance: 1,
            pointOfSaleId: posId,
          },
          {
            name: 'Shift 2',
            startingCashBalance: 100,
            pointOfSaleId: posId,
          },
          {
            name: 'Shift 3',
            startingCashBalance: 1000,
            pointOfSaleId: posId,
          },
        ],
      })
    })

    const data: FindAllShiftDto = {
      page: 1,
      rowsPerPage: 10,
      orderBy: undefined,
      query: undefined,
    }

    it('should find a shift', async () => {
      const { items } = await service.findAll(posId, data)

      expect(items.length).toBe(3)
    })

    it('should return correct pagination info', async () => {
      const { info } = await service.findAll(posId, data)

      expect(info.totalItems).toBe(3)
      expect(info.totalPages).toBe(1)
    })

    it('should filter items by name query', async () => {
      const { info } = await service.findAll(posId, {
        ...data,
        query: 'Shift 1',
      })

      expect(info.totalItems).toBe(1)
    })
  })

  describe('update', () => {
    const id = 'Test Shift 1'

    beforeEach(async () => {
      await db.cashierShift.create({
        data: {
          id,
          name: id,
          startingCashBalance: 100,
        },
      })
    })

    const data: UpdateShiftDto = {
      startingCashBalance: 1234,
    }

    it('should update the requested shift', async () => {
      await service.update(id, data)

      const shift = await db.cashierShift.findUnique({
        where: {
          id,
        },
      })

      expect(Number(shift?.startingCashBalance)).toBe(data.startingCashBalance)
    })

    it('should fail if the shift does not exist', async () => {
      await expect(service.update('non-existent', data)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('close', () => {
    const id = 'Test Shift 1'

    beforeEach(async () => {
      await db.cashierShift.create({
        data: {
          id,
          name: id,
          cashierId: userId,
          startingCashBalance: 100,
        },
      })
    })

    it('should close the requested shift', async () => {
      await service.close(id, userId)

      const shift = await db.cashierShift.findUnique({
        where: {
          id,
        },
      })

      expect(shift?.isOpened).toBeFalsy()
    })

    it('should fail if the shift does not exist', async () => {
      await expect(service.close('non-existent', userId)).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
