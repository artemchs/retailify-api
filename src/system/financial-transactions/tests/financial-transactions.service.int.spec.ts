import { DbService } from 'src/db/db.service'
import { FinancialTransactionsService } from '../financial-transactions.service'
import { Test } from '@nestjs/testing'
import { AppModule } from 'src/app.module'
import {
  CreateFinancialTransactionDto,
  CreateFinancialTransactionType,
} from '../dto/create-financial-transaction.dto'
import { FindAllFinancialTransactionsDto } from '../dto/findAll-financial-transactions'
import { NotFoundException } from '@nestjs/common'

describe('FinancialTransactions (int)', () => {
  let service: FinancialTransactionsService
  let db: DbService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    service = moduleRef.get(FinancialTransactionsService)
    db = moduleRef.get(DbService)

    await db.reset()
  })

  afterEach(async () => await db.reset())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    beforeEach(async () => {
      await Promise.all([
        db.customFinancialOperation.create({
          data: {
            name: 'asdf',
            id: 'customFinancialOperation',
          },
        }),
        db.supplier.create({
          data: {
            id: 'supplier',
            address: 'asfd',
            contactPerson: 'asdf',
            email: 'asdf',
            name: 'asdf',
            phone: 'asdf',
          },
        }),
      ])
    })

    const data: CreateFinancialTransactionDto = {
      amount: 100,
      date: new Date(),
      type: CreateFinancialTransactionType.OTHER,
      comment: 'asdfasdfasdf',
      customOperationId: 'customFinancialOperation',
    }

    it('should successfully create a custom financial transaction', async () => {
      await service.create(data)

      const transaction = await db.transaction.findFirst()

      expect(transaction).toBeDefined()
      expect(transaction).not.toBeNull()
      expect(transaction?.customOperationId).toBe('customFinancialOperation')
    })

    it('should successfully create a supplier payment transaction', async () => {
      const alteredData: CreateFinancialTransactionDto = {
        ...data,
        type: CreateFinancialTransactionType.SUPPLIER_PAYMENT,
        amount: 100,
        supplierId: 'supplier',
      }

      await service.create(alteredData)

      const transaction = await db.transaction.findFirst()

      expect(transaction).toBeDefined()
      expect(transaction).not.toBeNull()
      expect(transaction?.supplierId).toBe('supplier')
    })

    it('should fail if the supplier does not exist', async () => {
      const alteredData: CreateFinancialTransactionDto = {
        ...data,
        type: CreateFinancialTransactionType.SUPPLIER_PAYMENT,
        amount: 100,
        supplierId: 'non-existent-supplier',
      }

      await expect(service.create(alteredData)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('findAll', () => {
    beforeEach(async () => {
      await Promise.all([
        db.transaction.create({
          data: {
            id: '1',
            amount: 1000,
            direction: 'CREDIT',
            type: 'CASH_REGISTER_DEPOSIT',
            createdAt: new Date(2),
            shift: {
              create: {
                name: 'asdf',
                startingCashBalance: 1234,
                cashier: {
                  create: {
                    id: 'user',
                    email: 'asdf',
                    fullName: 'asdf',
                    hash: 'asdf',
                  },
                },
              },
            },
          },
        }),
        db.transaction.create({
          data: {
            id: '2',
            amount: 500,
            direction: 'DEBIT',
            type: 'CASH_REGISTER_WITHDRAWAL',
            createdAt: new Date(5),
          },
        }),
      ])
    })

    const data: FindAllFinancialTransactionsDto = {
      page: 1,
      rowsPerPage: 10,
    }

    it('should list all items', async () => {
      const { items } = await service.findAll(data)

      expect(items.length).toBe(2)
    })

    it('should return correct pagination info', async () => {
      const { info } = await service.findAll(data)

      expect(info.totalItems).toBe(2)
      expect(info.totalPages).toBe(1)
    })

    it('should correclty filter items by the "type" field', async () => {
      const extendedData: FindAllFinancialTransactionsDto = {
        ...data,
        types: ['CASH_REGISTER_DEPOSIT'],
      }

      const { info } = await service.findAll(extendedData)

      expect(info.totalItems).toBe(1)
    })

    it('should correclty filter items by the "direction" field', async () => {
      const extendedData: FindAllFinancialTransactionsDto = {
        ...data,
        directions: ['CREDIT'],
      }

      const { info } = await service.findAll(extendedData)

      expect(info.totalItems).toBe(1)
    })

    it('should correctly filter items by the system user who created the transaction', async () => {
      const extendedData: FindAllFinancialTransactionsDto = {
        ...data,
        systemUserIds: ['user'],
      }

      const { info } = await service.findAll(extendedData)

      expect(info.totalItems).toBe(1)
    })

    it('should correctly filter items by the "createdAt" field', async () => {
      const extendedData: FindAllFinancialTransactionsDto = {
        ...data,
        createdAt: {
          from: new Date(1).toISOString(),
          to: new Date(100).toISOString(),
        },
      }

      const { info } = await service.findAll(extendedData)

      expect(info.totalItems).toBe(2)
    })

    it('should correctly order items in ascending order by the "amount" field', async () => {
      const extendedData: FindAllFinancialTransactionsDto = {
        ...data,
        orderBy: {
          amount: 'asc',
        },
      }

      const { items } = await service.findAll(extendedData)

      expect(items[0].id).toBe('2')
    })
  })

  describe('findOne', () => {
    const id = '1'

    beforeEach(async () => {
      await db.transaction.create({
        data: {
          id,
          amount: 12345.68,
          direction: 'DEBIT',
          type: 'SALARY_PAYMENT',
        },
      })
    })

    it('should successfully find the requested transaction', async () => {
      const data = await service.findOne(id)

      expect(data).toBeDefined()
      expect(data).not.toBeNull()
    })

    it('should throw an exception if the transaction does not exist', async () => {
      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
