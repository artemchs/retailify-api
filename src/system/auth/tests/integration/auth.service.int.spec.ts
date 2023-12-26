import { Test } from '@nestjs/testing'
import { AppModule } from 'src/app.module'
import { DbService } from 'src/db/db.service'
import { AuthService } from '../../auth.service'
import { LogInDto, LogOutDto, SignUpDto } from '../../dto'
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import * as argon2 from 'argon2'

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

    it('should create a new user', async () => {
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

  describe('Log in', () => {
    const data: LogInDto = {
      username: 'username',
      password: 'password',
    }

    beforeEach(async () => {
      await db.systemUser.create({
        data: {
          username: data.username,
          hash: await argon2.hash(data.password),
          fullName: 'fullName',
        },
      })
    })

    it('should return access and refresh tokens', async () => {
      const tokens = await authService.logIn(data)

      expect(tokens.accessToken).toBeDefined()
      expect(tokens.refreshToken).toBeDefined()
    })

    it('should throw a not found exception because the user does not exist', async () => {
      let error: NotFoundException | null = null

      try {
        await authService.logIn({ ...data, username: 'non-existent-user' })
      } catch (e) {
        error = e
      }

      expect(error).not.toBeNull()
      expect(error?.getStatus()).toBe(404)
    })

    it('should throw an unauthorized exception because the password in incorrect', async () => {
      let error: UnauthorizedException | null = null

      try {
        await authService.logIn({ ...data, password: 'wrong-password' })
      } catch (e) {
        error = e
      }

      expect(error).not.toBeNull()
      expect(error?.getStatus()).toBe(401)
    })

    it('should update the refresh token hash in the database', async () => {
      await authService.logIn(data)

      const user = await db.systemUser.findFirst()

      expect(user?.rtHash).toBeDefined()
    })
  })

  describe('Log out', () => {
    const data: LogOutDto = {
      userId: 'userId',
    }

    beforeEach(async () => {
      await db.systemUser.createMany({
        data: [
          {
            id: 'userId',
            username: 'username1',
            fullName: 'fullName',
            hash: await argon2.hash('password'),
            rtHash: 'rtHash',
          },
          {
            id: 'otherUser',
            username: 'username2',
            fullName: 'fullName',
            hash: await argon2.hash('password'),
            rtHash: 'rtHash',
          },
        ],
      })
    })

    it('should successfully remove the refresh token hash from the database', async () => {
      await authService.logOut(data)

      const user = await db.systemUser.findUnique({
        where: {
          id: 'userId',
        },
      })

      expect(user?.rtHash).toBeNull()
    })

    it('should not remove refresh tokens from other users', async () => {
      await authService.logOut(data)

      const otherUser = await db.systemUser.findUnique({
        where: {
          id: 'otherUser',
        },
      })

      expect(otherUser?.rtHash).toBe('rtHash')
    })
  })
})
