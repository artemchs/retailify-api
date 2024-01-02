import { DbService } from 'src/db/db.service'
import { UsersService } from '../users.service'
import { AppModule } from 'src/app.module'
import { Test } from '@nestjs/testing'
import { UpdateMeDto } from '../dto/update-me.dto'
import { BadRequestException, NotFoundException } from '@nestjs/common'

describe('UsersService (int)', () => {
  let db: DbService
  let usersService: UsersService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    db = moduleRef.get(DbService)
    usersService = moduleRef.get(UsersService)

    await db.reset()
  })

  afterEach(async () => await db.reset())

  describe('Get me', () => {
    const userId = 'test-user'

    beforeEach(async () => {
      await db.systemUser.create({
        data: {
          id: userId,
          email: 'test@email.com',
          fullName: 'Test User',
          hash: 'hash',
        },
      })
    })

    it('should successfully return user data', async () => {
      const result = await usersService.getMe(userId)

      expect(result.email).toBeDefined()
    })

    it('should throw an exception if the user does not exist', async () => {
      let error: NotFoundException | null = null

      try {
        await usersService.getMe('non-existent')
      } catch (e) {
        error = e
      }

      expect(error).not.toBeNull()
      expect(error?.getStatus()).toBe(404)
    })
  })

  describe('Update me', () => {
    beforeEach(async () => {
      await db.systemUser.create({
        data: {
          id: 'test-user',
          email: 'test@email.com',
          fullName: 'Test User',
          hash: 'hash',
        },
      })
    })

    const data: UpdateMeDto = {
      email: 'new@email.com',
      fullName: 'Full Name',
    }
    const userId = 'test-user'

    it('should successfully update the user profile', async () => {
      await usersService.updateMe(data, userId)

      const updatedUser = await db.systemUser.findUnique({
        where: {
          id: userId,
        },
      })
      const usersCount = await db.systemUser.count()

      expect(updatedUser?.email).toBe(data.email)
      expect(updatedUser?.fullName).toBe(data.fullName)
      expect(updatedUser?.id).toBe(userId)
      expect(usersCount).toBe(1)
    })

    it('should successfully update even with the same email', async () => {
      await usersService.updateMe({ ...data, email: 'test@email.com' }, userId)

      const updatedUser = await db.systemUser.findUnique({
        where: {
          id: userId,
        },
      })

      expect(updatedUser?.email).toBe('test@email.com')
      expect(updatedUser?.fullName).toBe(data.fullName)
      expect(updatedUser?.id).toBe(userId)
    })

    it('should successfully update the profile picture', async () => {
      const file = Buffer.from('Hello World')
      await usersService.updateMe(data, userId, file)

      const updatedUser = await db.systemUser.findUnique({
        where: {
          id: userId,
        },
      })

      expect(updatedUser?.profilePictureKey).toBe(
        `profile_pictures/${updatedUser?.id}.jpg`,
      )
    })

    it('should not update the profile picture if the new picture was not provided', async () => {
      await usersService.updateMe(data, userId)

      const updatedUser = await db.systemUser.findUnique({
        where: {
          id: userId,
        },
      })

      expect(updatedUser?.profilePictureKey).toBeNull()
    })

    it('should throw an exception because the user does not exist', async () => {
      let error: NotFoundException | null = null

      try {
        await usersService.updateMe(data, 'non-existent')
      } catch (e) {
        error = e
      }

      expect(error).not.toBeNull()
      expect(error?.getStatus()).toBe(404)
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
        await usersService.updateMe(data, userId)
      } catch (e) {
        error = e
      }

      expect(error).not.toBeNull()
      expect(error?.getStatus()).toBe(400)
    })
  })

  describe('Update password', () => {
    beforeEach(async () => {
      await db.systemUser.create({
        data: {
          id: 'test-user',
          email: 'test@email.com',
          fullName: 'Test User',
          hash: 'hash',
        },
      })
    })

    it('should successfully update the password', async () => {
      await usersService.updatePassword('New Password', 'test-user')

      const updatedUser = await db.systemUser.findUnique({
        where: {
          id: 'test-user',
        },
      })

      expect(updatedUser?.hash).not.toBe('hash')
      expect(updatedUser?.rtHash).toBeNull()
    })

    it('should throw an exception because the user does not exist', async () => {
      let error: NotFoundException | null = null

      try {
        await usersService.updatePassword('New Password', 'non-existent')
      } catch (e) {
        error = e
      }

      expect(error).not.toBeNull()
      expect(error?.getStatus()).toBe(404)
    })
  })
})
