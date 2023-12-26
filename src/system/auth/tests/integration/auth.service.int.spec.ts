import { Test } from '@nestjs/testing'
import { AppModule } from 'src/app.module'
import { DbService } from 'src/db/db.service'
import { AuthService } from '../../auth.service'
import { SignUpDto } from '../../dto'
import { BadRequestException } from '@nestjs/common'

describe('AuthService Integration', () => {
  let db: DbService
  let authService: AuthService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    db = moduleRef.get(DbService)
    authService = moduleRef.get(AuthService)
  })

  afterEach(async () => await db.reset())

  describe('Sign up', () => {
    const data: SignUpDto = {
      username: 'username',
      fullName: 'fullname',
      password: 'password',
    }

    it('should successfully sign up', async () => {
      await authService.signUp(data)

      const usersCount = await db.systemUser.count()

      expect(usersCount).toBe(1)
    })

    it('should throw an exception because the username is already taken', async () => {
      await db.systemUser.create({
        data: {
          username: 'username',
          fullName: 'fullname',
          hash: 'hash',
        },
      })

      let error: BadRequestException | null = null

      try {
        await authService.signUp(data)
      } catch (e) {
        error = e
      }

      expect(error).not.toBeNull()
      expect(error?.getStatus()).toBe(400)
    })

    it('should update the refresh token hash in the database', async () => {
      await authService.signUp(data)

      const createdUser = await db.systemUser.findFirst()

      expect(createdUser?.rtHash).toBeDefined()
    })

    it('should return access and refresh tokens', async () => {
      const tokens = await authService.signUp(data)

      expect(tokens.accessToken).toBeDefined()
      expect(tokens.refreshToken).toBeDefined()
    })
  })
})
