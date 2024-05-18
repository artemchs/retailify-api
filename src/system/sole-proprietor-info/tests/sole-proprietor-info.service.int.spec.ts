import { DbService } from 'src/db/db.service'
import { SoleProprietorInfoService } from '../sole-proprietor-info.service'
import { Test } from '@nestjs/testing'
import { AppModule } from 'src/app.module'
import { NotFoundException } from '@nestjs/common'

describe('SoleProprietorInfoService', () => {
  let service: SoleProprietorInfoService
  let db: DbService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    db = moduleRef.get(DbService)
    service = moduleRef.get(SoleProprietorInfoService)

    await db.reset()
  })

  afterEach(async () => await db.reset())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  beforeEach(async () => {
    await db.systemUser.create({
      data: {
        id: 'user',
        email: 'asdf',
        fullName: 'asdf',
        hash: 'asdf',
        soleProprietorInfo: {
          create: {},
        },
      },
    })
  })

  describe('findOne', () => {
    it('should successfully find sole proprietor info', async () => {
      const info = await service.findOne('user')

      expect(info).toBeDefined()
      expect(info).not.toBeNull()
    })

    it('should throw an exception if the info does not exist', async () => {
      await expect(service.findOne('asdf')).rejects.toThrow(NotFoundException)
    })
  })

  describe('edit', () => {
    it('should successfully edit info', async () => {
      await service.edit('user', {
        tin: 'asdf',
      })

      const info = await db.soleProprietorInfo.findFirst()

      expect(info?.tin).toBe('asdf')
    })

    it('should successfully edit current accounts', async () => {
      await service.edit('user', {
        currentAccounts: [
          {
            name: 'Account 1',
            iban: 'asdf',
          },
        ],
      })
    })

    it('should throw an exception if the info does not exist', async () => {
      await expect(service.edit('asdf', {})).rejects.toThrow(NotFoundException)
    })
  })
})
