import { DbService } from 'src/db/db.service'
import { CustomOperationsService } from '../custom-operations.service'
import { Test } from '@nestjs/testing'
import { AppModule } from 'src/app.module'

describe('CustomOperationsService', () => {
  let service: CustomOperationsService
  let db: DbService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    service = moduleRef.get(CustomOperationsService)
    db = moduleRef.get(DbService)

    await db.reset()
  })

  afterEach(async () => await db.reset())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should successfully create a new custom operation', async () => {})
  })

  describe('findAll', () => {
    it('should find all custom operations', async () => {})
  })

  describe('findOne', () => {
    it('should find the requested custom operation', async () => {})

    it('should throw an exception if the custom operation does not exist', async () => {})
  })

  describe('update', () => {
    it('should update the requested custom operation', async () => {})

    it('should throw an exception if the custom operation does not exist', async () => {})
  })

  describe('remove', () => {
    it('should remove the requested custom operation', async () => {})

    it('should throw an exception if the custom operation does not exist', async () => {})

    it('should throw an exception if the custom operation is connected to transactions', async () => {})
  })
})
