import { Test } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { AppModule } from '../src/app.module'
import { DbService } from '../src/db/db.service'
import { LogInDto, SignUpDto } from '../src/system/auth/dto'
import { request, spec } from 'pactum'
import { UpdateMeDto } from '../src/system/users/dto/update-me.dto'
import { StorageService } from '../src/storage/storage.service'
import { UpdatePasswordDto } from 'src/system/users/dto'
import { CreateDto, UpdateDto } from '../src/system/employees/dto'
import { hashData } from '../src/system/common/utils'

describe('App', () => {
  let app: INestApplication
  let db: DbService
  let storage: StorageService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    )

    await app.init()
    await app.listen(process.env.PORT ?? 3000)

    db = app.get<DbService>(DbService)
    await db.reset()
    storage = app.get<StorageService>(StorageService)
    await storage.reset()

    request.setBaseUrl('http://localhost:3000')

    await db.allowedSystemUserEmail.createMany({
      data: [
        {
          email: 'test@email.com',
        },
        {
          email: 'test@admin.com',
        },
      ],
    })

    await db.systemUser.create({
      data: {
        id: 'admin-user',
        email: 'test@admin.com',
        fullName: 'Admin User',
        hash: await hashData('password'),
        role: 'ADMIN',
      },
    })
  })

  afterAll(async () => {
    await app.close()
  })

  describe('System', () => {
    describe('Auth', () => {
      describe('(POST) /system/auth/sign-up', () => {
        const body: SignUpDto = {
          email: 'test@email.com',
          fullName: 'New User',
          password: 'veryStrongPassword12345!',
        }

        const url = '/system/auth/sign-up'

        it('should successfully sign up', async () => {
          await spec().post(url).withBody(body).expectStatus(201)
        })

        it('should respond with `400` status code if the email is already in use', async () => {
          await spec().post(url).withBody(body).expectStatus(400)
        })

        it('should respond with a `403` status code if the provided email is not allowed', async () => {
          await spec()
            .post(url)
            .withBody({ ...body, email: 'random@email.com' })
            .expectStatus(403)
        })
      })

      describe('(POST) /system/auth/log-in', () => {
        const body: LogInDto = {
          email: 'test@email.com',
          password: 'veryStrongPassword12345!',
        }

        const url = '/system/auth/log-in'

        it('should successfully log in the account', async () => {
          await spec()
            .post(url)
            .withBody(body)
            .expectStatus(200)
            .stores('accessToken', 'accessToken')
        })

        it('should respond with `404` status code if the user does not exist', async () => {
          await spec()
            .post(url)
            .withBody({ ...body, email: 'non@existent.com' })
            .expectStatus(404)
        })

        it('should respond with `400` status code if the user provides a wrong password', async () => {
          await spec()
            .post(url)
            .withBody({ ...body, password: 'asdf' })
            .expectStatus(400)
        })
      })

      describe('(POST) /system/auth/log-out', () => {
        const url = '/system/auth/log-out'

        it('should successfully log out', async () => {
          await spec()
            .post(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(200)
        })

        it('should respond with `401` status code if the user does not provide the access token', async () => {
          await spec().post(url).expectStatus(401)
        })

        it('should respond with `401` status code if the user provides a wrong access token', async () => {
          await spec()
            .post(url)
            .withHeaders('Authorization', 'Bearer asd;fkjl')
            .expectStatus(401)
        })
      })
    })

    describe('Users', () => {
      describe('(GET) /system/users/me', () => {
        const url = '/system/users/me'

        it('should successfully get the user data', async () => {
          await spec()
            .get(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(200)
        })
      })

      describe('(PUT) /system/users/me', () => {
        const body: UpdateMeDto = {
          email: 'new@email.com',
          fullName: 'New Full Name',
        }

        const url = '/system/users/me'

        it('should successfully update the user profile', async () => {
          await spec()
            .put(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .withBody(body)
            .expectStatus(200)
        })

        it('should respond with `400` status code if the user provides an incorrect field', async () => {
          await spec()
            .put(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .withBody({ ...body, email: 'not-an-email' })
            .expectStatus(400)
        })

        it('should respond with `401` status code if the user does not provide an access token', async () => {
          await spec().put(url).withBody(body).expectStatus(401)
        })
      })

      describe('(PUT) /system/users/me/password', () => {
        const body: UpdatePasswordDto = {
          password: 'NewStrongPassword12345!@#$%^',
          passwordConfirm: 'NewStrongPassword12345!@#$%^',
        }

        const url = '/system/users/me/password'

        it('should respond with a `400` status code if the user provides a weak password', async () => {
          await spec()
            .put(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .withBody({ ...body, password: 'weak' })
            .expectStatus(400)
        })

        it('should respond with a `400` status code if the provided passwords do not match', async () => {
          await spec()
            .put(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .withBody({ ...body, passwordConfirm: 'Wrong Password' })
            .expectStatus(400)
        })

        it('should successfully update the user password', async () => {
          await spec()
            .put(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .withBody(body)
            .expectStatus(200)
        })

        it('should log the user out after a successfull password update', async () => {
          await spec().post('/system/auth/refresh-token').expectStatus(401)
        })
      })
    })

    describe('Roles', () => {
      it('should return a `403` status code if the user tries to access admin route', async () => {
        await spec()
          .post('/system/employees/')
          .withHeaders('Authorization', 'Bearer $S{accessToken}')
          .expectStatus(403)
      })

      it('should successfully log in to admin account', async () => {
        await spec()
          .post('/system/auth/log-in')
          .withBody({ email: 'test@admin.com', password: 'password' })
          .expectStatus(200)
          .stores('adminAccessToken', 'accessToken')
      })

      it('should be able to access admin routes as an admin', async () => {
        await spec()
          .post('/system/employees/')
          .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
          .expectStatus(400)
      })
    })

    describe('Employees', () => {
      let employeeId: string | undefined

      describe('(POST) /system/employees/', () => {
        const body: CreateDto = {
          password: 'NewStrongPassword12345!@#$%^',
          email: 'test@employee.com',
          fullName: 'Test Employee',
          role: 'CASHIER',
        }

        const url = '/system/employees/'

        it('should return a `403` status code if the user is not an admin', async () => {
          await spec()
            .post(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .withBody(body)
            .expectStatus(403)
        })

        it('should successfully create a new employee', async () => {
          await spec()
            .post(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .withBody(body)
            .expectStatus(201)
        })

        it('should get the id of a new employee', async () => {
          const employee = await db.systemUser.findUnique({
            where: {
              email: 'test@employee.com',
            },
          })

          employeeId = employee?.id

          expect(employee?.id).not.toBeNull()
          expect(employee?.id).toBeDefined()
        })
      })

      describe('(GET) /system/employees', () => {
        const url = '/system/employees/'

        it('should return a `200` status code', async () => {
          await spec()
            .get(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(200)
        })

        it('shoudl return a `403` status code if the user is not an admin', async () => {
          await spec()
            .get(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(403)
        })
      })

      describe('(PUT) /system/employees/:id', () => {
        const data: UpdateDto = {
          email: 'test@employee.com',
          fullName: 'Test Employee',
          role: 'ECOMMERCE_MANAGER',
        }

        it('should successfully update an employee', async () => {
          const url = `/system/employees/${employeeId}`

          await spec()
            .put(url)
            .withBody(data)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(200)
        })

        it('should return a `404` status code if the employee does not exist', async () => {
          await spec()
            .put('/system/employees/non-existent')
            .withBody(data)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(404)
        })

        it('should return a `400` status code if the email is already taken by other user', async () => {
          const url = `/system/employees/${employeeId}`

          await spec()
            .put(url)
            .withBody({ ...data, email: 'test@admin.com' })
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(400)
        })

        it('should return a `403` status code if the user is not an admin', async () => {
          const url = `/system/employees/${employeeId}`

          await spec()
            .put(url)
            .withBody(data)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(403)
        })
      })
    })
  })
})
