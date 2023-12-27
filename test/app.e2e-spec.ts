import * as request from 'supertest'
import { Test } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { AppModule } from '../src/app.module'
import { DbService } from '../src/db/db.service'
import { LogInDto, LogOutDto, SignUpDto } from '../src/system/auth/dto'

describe('Cats', () => {
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
  })

  afterAll(async () => {
    await app.close()
  })

  describe('System', () => {
    let accessToken: string
    let refreshToken: string

    describe('Auth', () => {
      describe('(POST) /system/auth/sign-up', () => {
        const body: SignUpDto = {
          username: 'user1',
          fullName: 'New User',
          password: 'strongPassword12345!',
        }

        const url = '/system/auth/sign-up'

        it('should successfully create a new user', () => {
          return request(app.getHttpServer())
            .post(url)
            .send(body)
            .expect(201)
            .expect((res) => {
              const data: { accessToken: string; refreshToken: string } =
                res.body

              expect(data.accessToken).toBeDefined()
              expect(data.refreshToken).toBeDefined()
            })
        })

        it('should respond with `400` status code if the username is already in use', () => {
          return request(app.getHttpServer()).post(url).send(body).expect(400)
        })
      })

      describe('(POST) /system/auth/log-in', () => {
        const body: LogInDto = {
          username: 'user1',
          password: 'strongPassword12345!',
        }

        const url = '/system/auth/log-in'

        it('should successfully log in the account', () => {
          return request(app.getHttpServer())
            .post(url)
            .send(body)
            .expect(200)
            .expect((res) => {
              const data: { accessToken: string; refreshToken: string } =
                res.body

              accessToken = data.accessToken
              refreshToken = data.refreshToken

              expect(data.accessToken).toBeDefined()
              expect(data.refreshToken).toBeDefined()
            })
        })

        it('should respond with `404` status code if the user does not exist', () => {
          return request(app.getHttpServer())
            .post(url)
            .send({ ...body, username: 'non-existent' })
            .expect(404)
        })

        it('should respond with `401` status code if the user provides a wrong password', () => {
          return request(app.getHttpServer())
            .post(url)
            .send({ ...body, password: 'wrong-password' })
            .expect(401)
        })
      })

      describe('(POST) /system/auth/refresh-token', () => {
        const url = '/system/auth/refresh-token'

        it('should successfully refresh tokens', () => {
          return request(app.getHttpServer())
            .post(url)
            .set('Authorization', `Bearer ${refreshToken}`)
            .expect(200)
            .expect((res) => {
              const data: { accessToken: string; refreshToken: string } =
                res.body

              accessToken = data.accessToken
              refreshToken = data.refreshToken

              expect(data.accessToken).toBeDefined()
              expect(data.refreshToken).toBeDefined()
            })
        })

        it('should respond with `401` status code if the user does not provide the refresh token', () => {
          return request(app.getHttpServer()).post(url).expect(401)
        })

        it('should respond with `401` status code if the user provides a wrong refresh token', () => {
          return request(app.getHttpServer())
            .post(url)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(401)
        })
      })

      describe('(POST) /system/auth/log-out', () => {
        const url = '/system/auth/log-out'

        it('should successfully log out', () => {
          return request(app.getHttpServer())
            .post(url)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200)
        })

        it('should respond with `401` status code if the user does not provide the access token', () => {
          return request(app.getHttpServer()).post(url).expect(401)
        })

        it('should respond with `401` status code if the user provides a wrong access token', () => {
          return request(app.getHttpServer())
            .post(url)
            .set('Authorization', `Bearer ${refreshToken}`)
            .expect(401)
        })
      })
    })
  })
})
