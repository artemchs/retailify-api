import { Test } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { AppModule } from '../src/app.module'
import { DbService } from '../src/db/db.service'
import { LogInDto, SignUpDto } from '../src/system/auth/dto'
import { request, spec } from 'pactum'
import { UpdateMeDto } from 'src/system/profile/dto/update-me.dto'

describe('App', () => {
  let app: INestApplication
  let db: DbService

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

    request.setBaseUrl('http://localhost:3000')
  })

  afterAll(async () => {
    await app.close()
  })

  describe('System', () => {
    describe('Auth', () => {
      describe('(POST) /system/auth/sign-up', () => {
        const body: SignUpDto = {
          email: 'test@email.com',
          phoneNumber: '+380661165978',
          fullName: 'New User',
          password: 'strongPassword12345!',
        }

        const url = '/system/auth/sign-up'

        it('should successfully sign up', async () => {
          await spec().post(url).withBody(body).expectStatus(201)
        })

        it('should respond with `400` status code if the username is already in use', async () => {
          await spec().post(url).withBody(body).expectStatus(400)
        })
      })

      describe('(POST) /system/auth/log-in', () => {
        const body: LogInDto = {
          email: 'test@email.com',
          password: 'strongPassword12345!',
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

        it('should respond with `401` status code if the user provides a wrong password', async () => {
          await spec()
            .post(url)
            .withBody({ ...body, password: 'asdf' })
            .expectStatus(401)
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

    describe('Profile', () => {
      describe('(PUT) /system/profile/me', () => {
        const body: UpdateMeDto = {
          email: 'new@email.com',
          fullName: 'New Full Name',
          phoneNumber: '0661165978',
        }

        const url = '/system/profile/me'

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
            .withBody({ ...body, phoneNumber: 'not a phone number' })
            .expectStatus(400)
        })

        it('should respond with `401` status code if the user does not provide an access token', async () => {
          await spec()
            .put(url)
            .withBody({ ...body, phoneNumber: 'not a phone number' })
            .expectStatus(401)
        })
      })
    })
  })
})
