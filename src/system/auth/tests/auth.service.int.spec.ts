import { Test } from '@nestjs/testing'
import { AppModule } from 'src/app.module'
import { DbService } from 'src/db/db.service'
import { AuthService } from '../auth.service'
import { LogInDto, LogOutDto, RefreshTokenDto, SignUpDto } from '../dto'
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import * as argon2 from 'argon2'

describe('AuthService (int)', () => {
  let db: DbService
  let authService: AuthService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    db = moduleRef.get(DbService)
    authService = moduleRef.get(AuthService)

    await db.reset()
  })

  beforeEach(
    async () =>
      await db.allowedSystemUserEmail.createMany({
        data: [
          {
            email: 'email',
          },
          {
            email: 'email1',
          },
          {
            email: 'email2',
          },
        ],
      }),
  )

  afterEach(async () => await db.reset())

  describe('Sign up', () => {
    const data: SignUpDto = {
      email: 'email',
      fullName: 'fullname',
      password: 'password',
    }

    it('should create a new user', async () => {
      await authService.signUp(data)

      const usersCount = await db.systemUser.count()

      expect(usersCount).toBe(1)
    })

    it('should throw an exception because the email is already taken', async () => {
      await db.systemUser.create({
        data: {
          email: data.email,
          fullName: data.fullName,
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
      email: 'email',
      password: 'password',
    }

    beforeEach(async () => {
      await db.systemUser.create({
        data: {
          email: data.email,
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
        await authService.logIn({ ...data, email: 'non-existent-user' })
      } catch (e) {
        error = e
      }

      expect(error).not.toBeNull()
      expect(error?.getStatus()).toBe(404)
    })

    it('should throw a bad request exception because the password in incorrect', async () => {
      let error: BadRequestException | null = null

      try {
        await authService.logIn({ ...data, password: 'wrong-password' })
      } catch (e) {
        error = e
      }

      expect(error).not.toBeNull()
      expect(error?.getStatus()).toBe(400)
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
            email: 'email1',
            fullName: 'fullName',
            hash: await argon2.hash('password'),
            rtHash: 'rtHash',
          },
          {
            id: 'otherUser',
            email: 'email2',
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

  describe('Refresh token', () => {
    const data: RefreshTokenDto = {
      userId: 'id',
      refreshToken: 'refreshToken',
    }

    let rtHash: string | null = null

    beforeEach(async () => {
      rtHash = await argon2.hash(data.refreshToken)

      await db.systemUser.create({
        data: {
          id: 'id',
          fullName: 'fullName',
          email: 'email',
          hash: 'hash',
          rtHash,
        },
      })
    })

    it('should return new access and refresh tokens', async () => {
      const tokens = await authService.refreshToken(data)

      expect(tokens.accessToken).toBeDefined()
      expect(tokens.refreshToken).toBeDefined()
    })

    it('should update the refresh token in the database', async () => {
      await authService.refreshToken(data)

      const user = await db.systemUser.findUnique({
        where: {
          id: 'id',
        },
      })

      expect(user?.rtHash).not.toBeNull()
      expect(user?.rtHash).not.toBe(rtHash)
    })

    it('should throw a not found exception if the user does not exist', async () => {
      let error: NotFoundException | null = null

      try {
        await authService.refreshToken({ ...data, userId: 'non-existent' })
      } catch (e) {
        error = e
      }

      expect(error).not.toBeNull()
      expect(error?.getStatus()).toBe(404)
    })

    it('should throw an unauthorized exception if the user does not have a refresh token hash in the database', async () => {
      await db.systemUser.create({
        data: {
          id: 'userId',
          email: 'test@email.com',
          fullName: 'fullName',
          hash: 'hash',
        },
      })

      let error: UnauthorizedException | null = null

      try {
        await authService.refreshToken({
          userId: 'userId',
          refreshToken: 'refreshToken',
        })
      } catch (e) {
        error = e
      }

      expect(error).not.toBeNull()
      expect(error?.getStatus()).toBe(401)
    })

    it('should throw an unauthorized exception if the provided refresh token does not match with the one in the database', async () => {
      let error: UnauthorizedException | null = null

      try {
        await authService.refreshToken({
          ...data,
          refreshToken: 'wrong-refresh-token',
        })
      } catch (e) {
        error = e
      }

      expect(error).not.toBeNull()
      expect(error?.getStatus()).toBe(401)
    })
  })
})
