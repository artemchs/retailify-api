import { Test } from '@nestjs/testing'
import { FiscalApiService } from '../fiscal-api.service'
import { AppModule } from '../../../app.module'

describe('FiscalApiService', () => {
  let service: FiscalApiService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    service = moduleRef.get(FiscalApiService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('Check server state', () => {
    it('should successfully check the server state', async () => {
      const res = await service.checkServerState()

      expect(res).toBeDefined()
      expect(res).not.toBeNull()
      expect(res.uid).toBeDefined()
      expect(res.timestamp).toBeDefined()
    })
  })
})
