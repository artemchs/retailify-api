import { DbService } from '../../../db/db.service'
import { StorageService } from '../../storage/storage.service'
import { AppModule } from '../../../app.module'
import { Test } from '@nestjs/testing'
import { join } from 'path'
import { ProductFields } from '../types'
import { readFile } from 'fs/promises'
import { minutes } from '@nestjs/throttler'
import { Prisma } from '@prisma/client'
import { ProductsImportService } from '../products-import.service'

const TEST_PHOTO_KEYS = [
  '982257_82096_2.jpg',
  '982257_82096_3.jpg',
  '982257_82096_4.jpg',
  '982257_82096_5.jpg',
  '982257_82098_2.jpg',
  '982257_82098_3.jpg',
  '982257_82098_4.jpg',
  '982257_82098_5.jpg',
  '982257_82099_2.jpg',
  '982257_82099_3.jpg',
  '982257_82099_4.jpg',
  '982257_82099_5.jpg',
  '982257_82100_2.jpg',
  '982257_82100_3.jpg',
  '982257_82100_4.jpg',
  '982257_82100_5.jpg',
  '982257_82101_2.jpg',
  '982257_82101_3.jpg',
  '982257_82101_4.jpg',
  '982257_82101_5.jpg',
  '982257_82102_2.jpg',
  '982257_82102_3.jpg',
  '982257_82102_4.jpg',
  '982257_82102_5.jpg',
  '982258_82103_2.jpg',
  '982258_82103_3.jpg',
  '982258_82103_4.jpg',
  '982258_82105_2.jpg',
  '982258_82105_3.jpg',
  '982258_82105_4.jpg',
  '982258_82106_2.jpg',
  '982258_82106_3.jpg',
  '982258_82106_4.jpg',
  '982258_82107_2.jpg',
  '982258_82107_3.jpg',
  '982258_82107_4.jpg',
  '982258_82108_2.jpg',
  '982258_82108_3.jpg',
  '982258_82108_4.jpg',
  '982258_82109_2.jpg',
  '982258_82109_3.jpg',
  '982258_82109_4.jpg',
  '982259_82110_2.jpg',
  '982259_82110_3.jpg',
  '982259_82110_4.jpg',
  '982259_82112_2.jpg',
  '982259_82112_3.jpg',
  '982259_82112_4.jpg',
  '982259_82113_2.jpg',
  '982259_82113_3.jpg',
  '982259_82113_4.jpg',
  '982259_82114_2.jpg',
  '982259_82114_3.jpg',
  '982259_82114_4.jpg',
  '982259_82115_2.jpg',
  '982259_82115_3.jpg',
  '982259_82115_4.jpg',
  '982259_82116_2.jpg',
  '982259_82116_3.jpg',
  '982259_82116_4.jpg',
]

describe('ImportSourcesService', () => {
  let service: ProductsImportService
  let db: DbService
  let storage: StorageService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    service = moduleRef.get(ProductsImportService)
    db = moduleRef.get(DbService)
    storage = moduleRef.get(StorageService)

    await db.reset()
  })

  afterEach(async () => await db.reset())
  afterEach(async () => await storage.reset())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  const warehouseId = 'Test Warehouse'

  describe('create', () => {
    beforeEach(async () => {
      await db.warehouse.create({
        data: {
          id: warehouseId,
          address: warehouseId,
          name: warehouseId,
        },
      })

      const [excelImportFile, csvImportFile] = await Promise.all([
        readFile(join(__dirname, './sync.xlsx')),
        readFile(join(__dirname, './sync.csv')),
      ])

      await Promise.all([
        Promise.all(
          TEST_PHOTO_KEYS.map((key) =>
            storage.uploadFile(`Media/${key}`, Buffer.from('Hi <3')),
          ),
        ),
        Promise.all([
          storage.uploadFile(
            'Import/sync.xlsx',
            excelImportFile,
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          ),
          storage.uploadFile('Import/sync.csv', csvImportFile, 'text/csv'),
        ]),
      ])

      const schema: {
        field: ProductFields
        incomingFileField: string
        isAdditionalField: boolean
      }[] = [
        {
          field: ProductFields.PRODUCT_ID,
          incomingFileField: 'ID_группы_разновидностей',
          isAdditionalField: false,
        },
        {
          field: ProductFields.VARIANT_ID,
          incomingFileField: 'Идентификатор_товара',
          isAdditionalField: false,
        },
        {
          field: ProductFields.PRODUCT_SKU,
          incomingFileField: 'Код_товара',
          isAdditionalField: false,
        },
        {
          field: ProductFields.PRODUCT_TITLE,
          incomingFileField: 'Название модели',
          isAdditionalField: true,
        },
        {
          field: ProductFields.VARIANT_PRICE,
          incomingFileField: 'Цена',
          isAdditionalField: false,
        },
        {
          field: ProductFields.PRODUCT_GENDER,
          incomingFileField: 'Пол',
          isAdditionalField: true,
        },
        {
          field: ProductFields.PRODUCT_SEASON,
          incomingFileField: 'Сезон',
          isAdditionalField: true,
        },
        {
          field: ProductFields.PRODUCT_MEDIA,
          incomingFileField: 'Фото',
          isAdditionalField: true,
        },
        {
          field: ProductFields.VARIANT_SIZE,
          incomingFileField: 'Размер',
          isAdditionalField: true,
        },
        {
          field: ProductFields.VARIANT_QUANTITY,
          incomingFileField: 'Количество',
          isAdditionalField: false,
        },
        {
          field: ProductFields.PRODUCT_SUPPLIER_SKU,
          incomingFileField: 'sku_postav',
          isAdditionalField: true,
        },
      ]

      await db.importSource.create({
        data: {
          id: 'importSource',
          name: '1',
          schema: schema as unknown as Prisma.JsonArray,
        },
      })
    })

    describe('products', () => {
      describe('create products import', () => {
        it(
          'should successfully import products from a .csv file',
          async () => {
            await service.createProductImport({
              fileKey: 'Import/sync.csv',
              importSourceId: 'importSource',
              warehouseId,
            })

            const productsCount = await db.product.count()
            const variantsCount = await db.variant.count()

            expect(productsCount).toBe(3)
            expect(variantsCount).toBe(12)
          },
          minutes(1),
        )

        it(
          'should successfully import products from an excel file',
          async () => {
            await service.createProductImport({
              fileKey: 'Import/sync.xlsx',
              importSourceId: 'importSource',
              warehouseId,
            })

            const productsCount = await db.product.count()
            const variantsCount = await db.variant.count()

            expect(productsCount).toBe(3)
            expect(variantsCount).toBe(12)
          },
          minutes(1),
        )
      })
    })
  })
})
