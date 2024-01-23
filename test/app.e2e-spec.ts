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
import { CreateSupplierDto } from 'src/system/suppliers/dto/create-supplier.dto'
import { UpdateSupplierDto } from 'src/system/suppliers/dto/update-supplier.dto'
import { CreateWarehouseDto } from 'src/system/warehouses/dto/create-warehouse.dto'
import { UpdateWarehouseDto } from 'src/system/warehouses/dto/update-warehouse.dto'
import { hashData } from '../src/system/common/utils/hash-data'
import { CreateGoodsReceiptDto } from 'src/system/goods-receipts/dto/create-goods-receipt.dto'
import { UpdateGoodsReceiptDto } from 'src/system/goods-receipts/dto/update-goods-receipt.dto'
import { CreateProductDto } from 'src/system/products/dto/create-product.dto'
import { UpdateProductDto } from 'src/system/products/dto/update-product.dto'
import { CreateColorDto } from 'src/system/colors/dto/create-color.dto'
import { UpdateColorDto } from 'src/system/colors/dto/update-color.dto'
import { CreateCharacteristicDto } from 'src/system/characteristics/dto/create-characteristic.dto'
import { UpdateCharacteristicDto } from 'src/system/characteristics/dto/update-characteristic.dto'
import { CreateValueDto } from 'src/system/characteristics/values/dto/create-value.dto'
import { UpdateValueDto } from 'src/system/characteristics/values/dto/update-value.dto'
import { CreateCollectionDto } from 'src/system/collections/dto/create-collection.dto'
import { UpdateCollectionDto } from 'src/system/collections/dto/update-collection.dto'
import { CreateVariantDto } from 'src/system/products/variants/dto/create-variant.dto'
import { UpdateVariantDto } from 'src/system/products/variants/dto/update-variant.dto'

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
    let supplierId: string | undefined
    let warehouseId: string | undefined
    let goodsReceiptId: string | undefined
    let productId: string | undefined
    let color1Id: string | undefined
    let color2Id: string | undefined
    let characteristicId: string | undefined
    let variantId: string | undefined
    let characteristicValueId: string | undefined
    let collectionId: string | undefined

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

        it('should return a `403` status code if the user is not an admin', async () => {
          await spec()
            .get(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(403)
        })
      })

      describe('(GET) /system/employees/:id', () => {
        it('should successfully get user data', async () => {
          const url = `/system/employees/${employeeId}`

          await spec()
            .get(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(200)
        })

        it('should respond with a `404` status code if the requested user does not exist', async () => {
          await spec()
            .get('/system/employees/non-existent')
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(404)
        })

        it('should respond with a `403` status code if the user is not an admin', async () => {
          const url = `/system/employees/${employeeId}`

          await spec()
            .get(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken  }')
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

      describe('(DELETE) /system/employees/:id', () => {
        it('should successfully remove an employee', async () => {
          const url = `/system/employees/${employeeId}`

          await spec()
            .delete(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(200)
        })

        it('should respond with a `404` status code if the employee does not exist', async () => {
          await spec()
            .delete('/system/employees/non-existent')
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(404)
        })

        it('should respond with a `403` status code if the user is not an admin', async () => {
          const url = `/system/employees/${employeeId}`

          await spec()
            .delete(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(403)
        })
      })
    })

    describe('Suppliers', () => {
      describe('(POST) /system/suppliers', () => {
        afterAll(async () => {
          const createdSupplier = await db.supplier.findFirst()
          supplierId = createdSupplier?.id
        })

        const url = '/system/suppliers'
        const data: CreateSupplierDto = {
          name: 'New Supplier',
          address: 'address',
          contactPerson: 'person',
          email: 'test@email.com',
          phone: '+380 66 116 5978',
        }

        it('should create a new supplier', async () => {
          await spec()
            .post(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .withBody(data)
            .expectStatus(201)
        })

        it('should respond with a `403` status code for a non-admin user', async () => {
          await spec()
            .post(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .withBody(data)
            .expectStatus(403)
        })
      })

      describe('(GET) /system/suppliers', () => {
        const url = '/system/suppliers'

        it('should list suppliers', async () => {
          await spec()
            .get(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(200)
        })
      })

      describe('(GET) /system/suppliers/:id', () => {
        it('should find the requested supplier', async () => {
          const url = `/system/suppliers/${supplierId}`

          await spec()
            .get(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(200)
        })

        it('should respond with a `404` status code if the supplier does not exist', async () => {
          await spec()
            .get('/system/suppliers/non-existent')
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(404)
        })
      })

      describe('(PUT) /system/suppliers/:id', () => {
        const data: UpdateSupplierDto = {
          name: 'Updated Supplier',
          address: 'address',
          contactPerson: 'person',
          email: 'test@email.com',
          phone: '+380 66 116 5978',
        }

        it('should update the requested supplier', async () => {
          const url = `/system/suppliers/${supplierId}`

          await spec()
            .put(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .withBody(data)
            .expectStatus(200)
        })

        it('should respond with a `404` status code if the supplier does not exist', async () => {
          await spec()
            .put('/system/suppliers/non-existent')
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .withBody(data)
            .expectStatus(404)
        })

        it('should respond with a `403` status code if the user is not an admin', async () => {
          const url = `/system/suppliers/${supplierId}`

          await spec()
            .put(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .withBody(data)
            .expectStatus(403)
        })
      })

      describe('(DELETE) /system/suppliers/:id', () => {
        it('should archive a supplier', async () => {
          const url = `/system/suppliers/${supplierId}`

          await spec()
            .delete(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(200)
        })

        it('should respond with a `404` status code if the supplier does not exist', async () => {
          await spec()
            .delete('/system/suppliers/non-existent')
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(404)
        })

        it('should respond with a `403` status code if the user is not an admin', async () => {
          const url = `/system/suppliers/${supplierId}`

          await spec()
            .delete(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(403)
        })
      })

      describe('(PUT) /system/suppliers/restore/:id', () => {
        it('should restore a supplier', async () => {
          const url = `/system/suppliers/restore/${supplierId}`

          await spec()
            .put(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(200)
        })

        it('should respond with a `404` status code if the supplier does not exist', async () => {
          await spec()
            .put('/system/suppliers/restore/non-existent')
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(404)
        })

        it('should respond with a `403` status code if the user is not an admin', async () => {
          const url = `/system/suppliers/restore/${supplierId}`

          await spec()
            .put(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(403)
        })
      })
    })

    describe('Warehouses', () => {
      describe('(POST) /system/warehouses', () => {
        afterAll(async () => {
          const createdWarehouse = await db.warehouse.findFirst()
          warehouseId = createdWarehouse?.id
        })

        const url = '/system/warehouses'
        const data: CreateWarehouseDto = {
          name: 'Warehouse 1',
          address: 'Warehouse Address 1',
        }

        it('should create a new warehouse', async () => {
          await spec()
            .post(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .withBody(data)
            .expectStatus(201)
        })

        it('should respond with a `403` status code for a non-admin user', async () => {
          await spec()
            .post(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .withBody(data)
            .expectStatus(403)
        })
      })

      describe('(GET) /system/warehoses', () => {
        const url = '/system/warehouses'

        it('should list warehouses', async () => {
          await spec()
            .get(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(200)
        })

        it('should respond with a `403` status code for a non-admin user', async () => {
          await spec()
            .get(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(403)
        })
      })

      describe('(GET) /system/suppliers/:id', () => {
        it('should find the requested warehouse', async () => {
          const url = `/system/warehouses/${warehouseId}`

          await spec()
            .get(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(200)
        })

        it('should respond with a `404` status code if the warehouse does not exist', async () => {
          await spec()
            .get('/system/warehouses/non-existent')
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(404)
        })

        it('should respond with a `403` status code for a non-admin user', async () => {
          const url = `/system/warehouses/${warehouseId}`

          await spec()
            .get(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(403)
        })
      })

      describe('(PUT) /system/warehouses/:id', () => {
        const data: UpdateWarehouseDto = {
          name: 'Updated Warehouse 1',
          address: 'Warehouse Address 1',
        }

        it('should update the requested warehouse', async () => {
          const url = `/system/warehouses/${warehouseId}`

          await spec()
            .put(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .withBody(data)
            .expectStatus(200)
        })

        it('should respond with a `403` status code for a non-admin user', async () => {
          const url = `/system/warehouses/${warehouseId}`

          await spec()
            .put(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .withBody(data)
            .expectStatus(403)
        })
      })

      describe('(DELETE) /system/warehouses/:id', () => {
        it('should archive the requested warehouse', async () => {
          const url = `/system/warehouses/${warehouseId}`

          await spec()
            .delete(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(200)
        })

        it('should respond with a `404` status code if the warehouse does not exist', async () => {
          await spec()
            .delete('/system/warehouses/non-existent')
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(404)
        })

        it('should respond with a `403` status code if the user is not an admin', async () => {
          const url = `/system/warehouses/${supplierId}`

          await spec()
            .delete(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(403)
        })
      })

      describe('(PUT) /system/warehouses/restore/:id', () => {
        it('should restore the requested warehouse', async () => {
          const url = `/system/warehouses/restore/${warehouseId}`

          await spec()
            .put(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(200)
        })

        it('should respond with a `404` status code if the warehouse does not exist', async () => {
          await spec()
            .put('/system/warehouses/restore/non-existent')
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(404)
        })

        it('should respond with a `403` status code if the user is not an admin', async () => {
          const url = `/system/warehouses/restore/${warehouseId}`

          await spec()
            .put(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(403)
        })
      })
    })

    describe('Goods Receipts', () => {
      describe('(POST) /system/goods-receipts', () => {
        afterAll(async () => {
          const createdGoodsReceipt = await db.goodsReceipt.findFirst()
          goodsReceiptId = createdGoodsReceipt?.id
        })

        const url = '/system/goods-receipts'

        it('should create a new goods receipt', async () => {
          const data: CreateGoodsReceiptDto = {
            goodsReceiptDate: new Date(),
            paymentOption: 'PRIVATE_FUNDS',
            paymentTerm: 'PAYMENT_ON_REALIZATION',
            supplierId: supplierId!,
            warehouseId: warehouseId!,
          }

          await spec()
            .post(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .withBody(data)
            .expectStatus(201)
        })

        it('should respond with a `403` status code for a non-admin user', async () => {
          const data: CreateGoodsReceiptDto = {
            goodsReceiptDate: new Date(),
            paymentOption: 'PRIVATE_FUNDS',
            paymentTerm: 'PAYMENT_ON_REALIZATION',
            supplierId: supplierId!,
            warehouseId: warehouseId!,
          }

          await spec()
            .post(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .withBody(data)
            .expectStatus(403)
        })
      })

      describe('(GET) /system/goods-receipts', () => {
        const url = '/system/goods-receipts'

        it('should list goods receipts', async () => {
          await spec()
            .get(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(200)
        })

        it('should respond with a `403` status code for a non-admin user', async () => {
          await spec()
            .get(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(403)
        })
      })

      describe('(GET) /system/goods-receipts/:id', () => {
        it('should find the requested goods receipt', async () => {
          const url = `/system/goods-receipts/${goodsReceiptId}`

          await spec()
            .get(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(200)
        })

        it('should respond with a `404` status code if the goods receipt does not exist', async () => {
          await spec()
            .get('/system/goods-receipts/non-existent')
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(404)
        })

        it('should respond with a `403` status code for a non-admin user', async () => {
          const url = `/system/goods-receipts/${goodsReceiptId}`

          await spec()
            .get(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(403)
        })
      })

      describe('(PUT) /system/goods-receipts/:id', () => {
        const data: UpdateGoodsReceiptDto = {
          paymentOption: 'CURRENT_ACCOUNT',
        }

        it('should update the requested goods receipt', async () => {
          const url = `/system/goods-receipts/${goodsReceiptId}`

          await spec()
            .put(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .withBody(data)
            .expectStatus(200)
        })

        it('should respond with a `403` status code for a non-admin user', async () => {
          const url = `/system/goods-receipts/${goodsReceiptId}`

          await spec()
            .put(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .withBody(data)
            .expectStatus(403)
        })
      })
    })

    describe('Colors', () => {
      const baseUrl = '/system/colors'

      describe('(POST) /system/colors', () => {
        afterAll(async () => {
          const createdColors = await db.color.findMany({
            orderBy: {
              id: 'asc',
            },
          })

          color1Id = createdColors[0].id
          color2Id = createdColors[1].id
        })

        const dataColor1: CreateColorDto = {
          color: 'Test Color 1',
          name: 'Test Color 1',
        }
        const dataColor2: CreateColorDto = {
          color: 'Test Color 2',
          name: 'Test Color 2',
        }

        it('should create a new color', async () => {
          await spec()
            .post(baseUrl)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .withBody(dataColor1)
            .expectStatus(201)
        })

        it('should create an another color', async () => {
          await spec()
            .post(baseUrl)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .withBody(dataColor2)
            .expectStatus(201)
        })

        it('should respond with a `403` status code if the user is not an admin', async () => {
          await spec()
            .post(baseUrl)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .withBody(dataColor1)
            .expectStatus(403)
        })
      })

      describe('(GET) /system/colors', () => {
        it('should list colors', async () => {
          await spec()
            .get(baseUrl)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(200)
        })

        it('should respond with a `403` status code for a non-admin user', async () => {
          await spec()
            .get(baseUrl)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(403)
        })
      })

      describe('(GET) /system/colors/:id', () => {
        it('should find the first color', async () => {
          const url = baseUrl + '/' + color1Id

          await spec()
            .get(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(200)
        })

        it('should find the second color', async () => {
          const url = baseUrl + '/' + color2Id

          await spec()
            .get(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(200)
        })

        it('should respond with a `404` status code if the color does not exist', async () => {
          const url = baseUrl + '/' + 'non-existent'

          await spec()
            .get(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(404)
        })

        it('should respond with a `403` status code if the user is not an admin', async () => {
          const url = baseUrl + '/' + color1Id

          await spec()
            .get(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(403)
        })
      })

      describe('(PUT) /system/colors/:id', () => {
        const data: UpdateColorDto = {
          color: 'Updated Test Color 1',
        }

        it('should update the requested color', async () => {
          const url = baseUrl + '/' + color1Id

          await spec()
            .put(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .withBody(data)
            .expectStatus(200)
        })

        it('should respond with a `403` status code if the user is not an admin', async () => {
          const url = baseUrl + '/' + color1Id

          await spec()
            .put(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .withBody(data)
            .expectStatus(403)
        })
      })

      describe('(DELETE) /system/colors/:id', () => {
        beforeAll(async () => {
          await db.color.create({
            data: {
              id: 'Test Color 3',
              color: 'Test Color 3',
              name: 'Test Color 3',
            },
          })
        })

        it('should respond with a `404` status code if the color does not exist', async () => {
          const url = baseUrl + '/' + 'non-exitstent'

          await spec()
            .delete(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(404)
        })

        it('should respond with a `403` status code if the user is not an admin', async () => {
          const url = baseUrl + '/' + 'Test Color 3'

          await spec()
            .delete(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(403)
        })

        it('should remove the requested color', async () => {
          const url = baseUrl + '/' + 'Test Color 3'

          await spec()
            .delete(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(200)
        })
      })
    })

    describe('Characteristics', () => {
      const baseUrl = '/system/characteristics'

      describe('(POST) /system/characteristics', () => {
        afterAll(async () => {
          const createdCharacteristic = await db.characteristic.findFirst()
          characteristicId = createdCharacteristic?.id
        })

        const data: CreateCharacteristicDto = {
          name: 'Test Characteristic 1',
        }

        it('should create a new characteristic', async () => {
          await spec()
            .post(baseUrl)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .withBody(data)
            .expectStatus(201)
        })

        it('should respond with a `403` status code if the user is not an admin', async () => {
          await spec()
            .post(baseUrl)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .withBody(data)
            .expectStatus(403)
        })
      })

      describe('(GET) /system/characteristics', () => {
        it('should list characteristics', async () => {
          await spec()
            .get(baseUrl)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(200)
        })

        it('should respond with a `403` status code for a non-admin user', async () => {
          await spec()
            .get(baseUrl)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(403)
        })
      })

      describe('(GET) /system/characteristics/:characteristicId', () => {
        it('should find the requested characteristic', async () => {
          const url = baseUrl + '/' + characteristicId

          await spec()
            .get(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(200)
        })

        it('should respond with a `404` status code if the characteristic does not exist', async () => {
          const url = baseUrl + '/' + 'non-existent'

          await spec()
            .get(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(404)
        })

        it('should respond with a `403` status code if the user is not an admin', async () => {
          const url = baseUrl + '/' + characteristicId

          await spec()
            .get(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(403)
        })
      })

      describe('(PUT) /system/characteristics/:characteristicId', () => {
        const data: UpdateCharacteristicDto = {
          name: 'Updated Test Characteristic 1',
        }

        it('should update the requested characteristic', async () => {
          const url = baseUrl + '/' + characteristicId

          await spec()
            .put(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .withBody(data)
            .expectStatus(200)
        })

        it('should respond with a `403` status code if the user is not an admin', async () => {
          const url = baseUrl + '/' + characteristicId

          await spec()
            .put(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .withBody(data)
            .expectStatus(403)
        })
      })

      describe('(DELETE) /system/characteristics/:characteristicId', () => {
        beforeAll(async () => {
          await db.characteristic.create({
            data: {
              id: 'Test Characteristic 2',
              name: 'Test Characteristic 2',
            },
          })
        })

        const id = 'Test Characteristic 2'

        it('should respond with a `404` status code if the characteristic does not exist', async () => {
          const url = baseUrl + '/' + 'non-exitstent'

          await spec()
            .delete(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(404)
        })

        it('should respond with a `403` status code if the user is not an admin', async () => {
          const url = baseUrl + '/' + id

          await spec()
            .delete(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(403)
        })

        it('should remove the requested characteristic', async () => {
          const url = baseUrl + '/' + id

          await spec()
            .delete(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(200)
        })
      })

      describe('Values', () => {
        describe('(POST) /system/characteristics/:characteristicId/values', () => {
          afterAll(async () => {
            const createdValue = await db.characteristicValue.findFirst()
            characteristicValueId = createdValue?.id
          })

          const data: CreateValueDto = {
            value: 'Test Value 1',
          }

          it('should create a new value', async () => {
            await spec()
              .post(`${baseUrl}/${characteristicId}/values`)
              .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
              .withBody(data)
              .expectStatus(201)
          })

          it('should respond with a `403` status code if the user is not an admin', async () => {
            await spec()
              .post(`${baseUrl}/${characteristicId}/values`)
              .withHeaders('Authorization', 'Bearer $S{accessToken}')
              .withBody(data)
              .expectStatus(403)
          })
        })

        describe('(GET) /system/characteristics/:characteristicId/values', () => {
          it('should list values', async () => {
            await spec()
              .get(`${baseUrl}/${characteristicId}/values`)
              .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
              .expectStatus(200)
          })

          it('should respond with a `403` status code for a non-admin user', async () => {
            await spec()
              .get(`${baseUrl}/${characteristicId}/values`)
              .withHeaders('Authorization', 'Bearer $S{accessToken}')
              .expectStatus(403)
          })
        })

        describe('(GET) /system/characteristics/:characteristicId/values/:valueId', () => {
          it('should find the requested value', async () => {
            const url = `${baseUrl}/${characteristicId}/values/${characteristicValueId}`

            await spec()
              .get(url)
              .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
              .expectStatus(200)
          })

          it('should respond with a `404` status code if the value does not exist', async () => {
            const url = `${baseUrl}/${characteristicId}/values/non-existent`

            await spec()
              .get(url)
              .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
              .expectStatus(404)
          })

          it('should respond with a `403` status code if the user is not an admin', async () => {
            const url = `${baseUrl}/${characteristicId}/values/${characteristicValueId}`

            await spec()
              .get(url)
              .withHeaders('Authorization', 'Bearer $S{accessToken}')
              .expectStatus(403)
          })
        })

        describe('(PUT) /system/characteristics/:characteristicId/values/:valueId', () => {
          const data: UpdateValueDto = {
            value: 'Updated Test Value 1',
          }

          it('should update the requested value', async () => {
            const url = `${baseUrl}/${characteristicId}/values/${characteristicValueId}`

            await spec()
              .put(url)
              .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
              .withBody(data)
              .expectStatus(200)
          })

          it('should respond with a `403` status code if the user is not an admin', async () => {
            const url = `${baseUrl}/${characteristicId}/values/${characteristicValueId}`

            await spec()
              .put(url)
              .withHeaders('Authorization', 'Bearer $S{accessToken}')
              .withBody(data)
              .expectStatus(403)
          })
        })

        describe('(DELETE) /system/characteristics/:characteristicId/values/:valueId', () => {
          it('should respond with a `404` status code if the value does not exist', async () => {
            const url = `${baseUrl}/${characteristicId}/values/non-existent`

            await spec()
              .delete(url)
              .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
              .expectStatus(404)
          })

          it('should respond with a `403` status code if the user is not an admin', async () => {
            await db.characteristicValue.create({
              data: {
                id: 'Test Value 3',
                value: 'Test Value 3',
                characteristicId: characteristicId,
              },
            })

            const url = `${baseUrl}/${characteristicId}/values/Test Value 3`

            await spec()
              .delete(url)
              .withHeaders('Authorization', 'Bearer $S{accessToken}')
              .expectStatus(403)
          })

          it('should remove the requested value', async () => {
            const url = `${baseUrl}/${characteristicId}/values/Test Value 3`

            await spec()
              .delete(url)
              .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
              .expectStatus(200)
          })
        })
      })
    })

    describe('Products', () => {
      const baseUrl = '/system/products'

      describe('(POST) /system/products', () => {
        afterAll(async () => {
          const createdProduct = await db.product.findFirst()
          productId = createdProduct?.id
        })

        const data: CreateProductDto = {
          title: 'Test Product 1',
          description: 'Test Product 1',
          colors: [],
          media: [
            {
              id: 'media_1',
              index: 0,
            },
            {
              id: 'media_2',
              index: 0,
            },
          ],
          packagingHeight: 10,
          packagingLength: 10,
          packagingWeight: 10,
          packagingWidth: 10,
        }

        it('should create a new product', async () => {
          await spec()
            .post(baseUrl)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .withBody({
              ...data,
              colors: [
                {
                  colorId: color1Id!,
                  index: 0,
                },
                {
                  colorId: color2Id!,
                  index: 1,
                },
              ],
            })
            .expectStatus(201)
        })

        it('should respond with a `403` status code if the user is not an admin', async () => {
          await spec()
            .post(baseUrl)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .withBody({
              ...data,
              colors: [
                {
                  colorId: color1Id!,
                  index: 0,
                },
                {
                  colorId: color2Id!,
                  index: 1,
                },
              ],
            })
            .expectStatus(403)
        })
      })

      describe('(GET) /system/products', () => {
        it('should list products', async () => {
          await spec()
            .get(baseUrl)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(200)
        })

        it('should respond with a `403` status code for a non-admin user', async () => {
          await spec()
            .get(baseUrl)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(403)
        })
      })

      describe('(GET) /system/products/:productId', () => {
        it('should find the requested product', async () => {
          const url = baseUrl + '/' + productId

          await spec()
            .get(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(200)
        })

        it('should respond with a `404` status code if the product does not exist', async () => {
          const url = baseUrl + '/' + 'non-existent'

          await spec()
            .get(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(404)
        })

        it('should respond with a `403` status code if the user is not an admin', async () => {
          const url = baseUrl + '/' + productId

          await spec()
            .get(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(403)
        })
      })

      describe('(PUT) /system/products/:productId', () => {
        const data: UpdateProductDto = {
          description: 'Updated Test Product 1',
        }

        it('should update the requested product', async () => {
          const url = baseUrl + '/' + productId

          await spec()
            .put(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .withBody(data)
            .expectStatus(200)
        })

        it('should respond with a `403` status code if the user is not an admin', async () => {
          const url = baseUrl + '/' + productId

          await spec()
            .put(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .withBody(data)
            .expectStatus(403)
        })
      })

      describe('(DELETE) /system/products/:productId', () => {
        it('should archive the requested product', async () => {
          const url = baseUrl + '/' + productId

          await spec()
            .delete(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(200)
        })

        it('should respond with a `404` status code if the product does not exist', async () => {
          const url = baseUrl + '/' + 'non-exitstent'

          await spec()
            .delete(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(404)
        })

        it('should respond with a `403` status code if the user is not an admin', async () => {
          const url = baseUrl + '/' + productId

          await spec()
            .delete(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(403)
        })
      })

      describe('(PUT) /system/products/restore/:productId', () => {
        it('should restore the requested product', async () => {
          const url = baseUrl + '/restore/' + productId

          await spec()
            .put(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(200)
        })

        it('should respond with a `404` status code if the product does not exist', async () => {
          const url = baseUrl + '/restore/' + 'non-exitstent'

          await spec()
            .put(url)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(404)
        })

        it('should respond with a `403` status code if the user is not an admin', async () => {
          const url = baseUrl + '/restore/' + productId

          await spec()
            .put(url)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(403)
        })
      })

      describe('Variants', () => {
        describe('(POST) /system/products/:productId/variants', () => {
          afterAll(async () => {
            const createdVariant = await db.variant.findFirst()
            variantId = createdVariant?.id
          })

          const data: CreateVariantDto = {
            price: 59.99,
            size: 'XL',
            sku: '12345',
          }

          it('should create a new product', async () => {
            const url = `${baseUrl}/${productId}/variants`

            await spec()
              .post(url)
              .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
              .withBody(data)
              .expectStatus(201)
          })

          it('should respond with a `403` status code if the user is not an admin', async () => {
            const url = `${baseUrl}/${productId}/variants`

            await spec()
              .post(url)
              .withHeaders('Authorization', 'Bearer $S{accessToken}')
              .withBody(data)
              .expectStatus(403)
          })
        })

        describe('(GET) /system/products/:productId/variants', () => {
          it('should list variants', async () => {
            const url = `${baseUrl}/${productId}/variants`

            await spec()
              .get(url)
              .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
              .expectStatus(200)
          })

          it('should respond with a `403` status code for a non-admin user', async () => {
            const url = `${baseUrl}/${productId}/variants`

            await spec()
              .get(url)
              .withHeaders('Authorization', 'Bearer $S{accessToken}')
              .expectStatus(403)
          })
        })

        describe('(GET) /system/products/:productId/variants/:variantId', () => {
          it('should find the requested variant', async () => {
            const url = `${baseUrl}/${productId}/variants/${variantId}`

            await spec()
              .get(url)
              .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
              .expectStatus(200)
          })

          it('should respond with a `404` status code if the variant does not exist', async () => {
            const url = `${baseUrl}/${productId}/variants/non-existent`

            await spec()
              .get(url)
              .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
              .expectStatus(404)
          })

          it('should respond with a `403` status code if the user is not an admin', async () => {
            const url = `${baseUrl}/${productId}/variants/${variantId}`

            await spec()
              .get(url)
              .withHeaders('Authorization', 'Bearer $S{accessToken}')
              .expectStatus(403)
          })
        })

        describe('(PUT) /system/products/:productId/variants/:variantId', () => {
          it('should update the requested variant', async () => {
            const url = `${baseUrl}/${productId}/variants/${variantId}`

            const data: UpdateVariantDto = {
              size: 'SM',
            }

            await spec()
              .put(url)
              .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
              .withBody(data)
              .expectStatus(200)
          })

          it('should respond with a `403` status code if the user is not an admin', async () => {
            const url = `${baseUrl}/${productId}/variants/${variantId}`

            const data: UpdateVariantDto = {
              size: 'SM',
            }

            await spec()
              .put(url)
              .withHeaders('Authorization', 'Bearer $S{accessToken}')
              .withBody(data)
              .expectStatus(403)
          })
        })

        describe('(DELETE) /system/products/:productId/variants/:variantId', () => {
          it('should archive the requested variant', async () => {
            const url = `${baseUrl}/${productId}/variants/${variantId}`

            await spec()
              .delete(url)
              .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
              .expectStatus(200)
          })

          it('should respond with a `403` status code if the user is not an admin', async () => {
            const url = `${baseUrl}/${productId}/variants/${variantId}`

            await spec()
              .delete(url)
              .withHeaders('Authorization', 'Bearer $S{accessToken}')
              .expectStatus(403)
          })
        })

        describe('(PUT) /system/products/:productId/variants/restore/:variantId', () => {
          it('should restore the requested variants', async () => {
            const url = `${baseUrl}/${productId}/variants/restore/${variantId}`

            await spec()
              .put(url)
              .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
              .expectStatus(200)
          })

          it('should respond with a `403` status code if the user is not an admin', async () => {
            const url = `${baseUrl}/${productId}/variants/restore/${variantId}`

            await spec()
              .put(url)
              .withHeaders('Authorization', 'Bearer $S{accessToken}')
              .expectStatus(403)
          })
        })
      })
    })

    describe('Collections', () => {
      const baseUrl = '/system/collections'

      describe('(POST) /system/collections', () => {
        afterAll(async () => {
          const createdCollection = await db.collection.findFirst()
          collectionId = createdCollection?.id
        })

        const data: CreateCollectionDto = {
          name: 'Test Collection 1',
        }

        it('should create a new collection', async () => {
          await spec()
            .post(baseUrl)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .withBody({
              ...data,
              characteristics: [
                {
                  id: characteristicId,
                },
              ],
              products: [
                {
                  id: productId,
                },
              ],
            })
            .expectStatus(201)
        })

        it('should respond with a `403` status code if the user is not an admin', async () => {
          await spec()
            .post(baseUrl)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .withBody({
              ...data,
              characteristics: [
                {
                  id: characteristicId,
                },
              ],
              products: [
                {
                  id: productId,
                },
              ],
            })
            .expectStatus(403)
        })
      })

      describe('(GET) /system/collections', () => {
        it('should list collections', async () => {
          await spec()
            .get(baseUrl)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(200)
        })

        it('should respond with a `403` status code for a non-admin user', async () => {
          await spec()
            .get(baseUrl)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(403)
        })
      })

      describe('(GET) /system/collections/:id', () => {
        it('should find the requested collection', async () => {
          await spec()
            .get(`${baseUrl}/${collectionId}`)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(200)
        })

        it('should respond with a `404` status code if the requested collection does not exist', async () => {
          await spec()
            .get(`${baseUrl}/non-existent`)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(404)
        })

        it('should respond with a `403` status code if the user is not an admin', async () => {
          await spec()
            .get(`${baseUrl}/${collectionId}`)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(403)
        })
      })

      describe('(PUT) /system/collections/:id', () => {
        const data: UpdateCollectionDto = {
          name: 'Updated Test Collection 1',
        }

        it('should update the requested collection', async () => {
          await spec()
            .put(`${baseUrl}/${collectionId}`)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .withBody(data)
            .expectStatus(200)
        })

        it('should respond with a `403` status code if the user is not an admin', async () => {
          await spec()
            .put(`${baseUrl}/${collectionId}`)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .withBody(data)
            .expectStatus(403)
        })
      })

      describe('(DELETE) /system/collections/:id', () => {
        it('should archive the requested collection', async () => {
          await spec()
            .delete(`${baseUrl}/${collectionId}`)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(200)
        })

        it('should respond with a `403` status code if the user is not an admin', async () => {
          await spec()
            .delete(`${baseUrl}/${collectionId}`)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(403)
        })
      })

      describe('(PUT) /system/collections/restore/:id', () => {
        it('should archive the requested collection', async () => {
          await spec()
            .put(`${baseUrl}/restore/${collectionId}`)
            .withHeaders('Authorization', 'Bearer $S{adminAccessToken}')
            .expectStatus(200)
        })

        it('should respond with a `403` status code if the user is not an admin', async () => {
          await spec()
            .put(`${baseUrl}/restore/${collectionId}`)
            .withHeaders('Authorization', 'Bearer $S{accessToken}')
            .expectStatus(403)
        })
      })
    })
  })
})
