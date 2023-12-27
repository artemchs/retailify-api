import { Test } from '@nestjs/testing'
import { AuthService } from '../auth.service'
import { AuthController } from '../auth.controller'
import { DbService } from 'src/db/db.service'
import { UserPayloadAccessToken } from 'src/system/common/types'
import { JwtService } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'

describe('AuthService (unit)', () => {
  let authService: AuthService

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [AuthService, DbService, JwtService, ConfigService],
      controllers: [AuthController],
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env.test',
        }),
      ],
    })
      .overrideProvider(DbService)
      .useValue({})
      .compile()

    authService = moduleRef.get<AuthService>(AuthService)
  })

  describe('signTokens', () => {
    it('should return access and refresh tokens', async () => {
      const data: UserPayloadAccessToken = {
        sub: 'sub',
        username: 'username',
        fullName: 'fullName',
      }

      const result = await authService.signTokens(data)

      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
    })
  })

  describe('hashData', () => {
    it('should return hashed data', async () => {
      const data = 'Hello World!'

      const result = await authService.hashData(data)

      expect(result).toBeDefined()
      expect(result).not.toBe(data)
    })
  })
})
