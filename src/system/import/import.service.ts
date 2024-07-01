import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CreateImportDto } from './dto/create-import.dto'
import { DbService } from '../../db/db.service'
import { StorageService } from '../storage/storage.service'
import {
  ImportFileType,
  Prisma,
  ProductGender,
  ProductSeason,
} from '@prisma/client'
import * as xlsx from 'xlsx'
import * as csv from 'csv-parser'
import {
  ImportItemSchema,
  ImportProduct,
  ImportProductFieldsType,
  ImportVariantFieldsType,
  ProductFieldValues,
  ProductFields,
} from './types'
import { Readable } from 'stream'
import { PrismaTx } from '../common/types'
import { minutes } from '@nestjs/throttler'
import { FindAllImportDto } from './dto/findAll-import.dto'
import {
  buildContainsArray,
  buildOrderByArray,
  calculateTotalPages,
  getPaginationData,
} from '../common/utils/db-helpers'

@Injectable()
export class ImportService {
  constructor(
    private readonly db: DbService,
    private readonly storage: StorageService,
  ) {}

  private readonly FILE_TYPES = {
    XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    XLS: 'application/vnd.ms-excel',
    CSV: 'text/csv',
  }

  private readonly FIELD_VALUES = {
    product_gender: {
      MALE: ['для мальчиков', 'мужской', 'чоловічий', 'для хлопчиків'],
      FEMALE: ['для девочек', 'дівчачий', 'девчачий', 'для дівчаток'],
      UNISEX: ['унісекс', 'унисекс'],
    },
    product_season: {
      WINTER: ['зимний'],
      SPRING_FALL: ['осенне-весенний'],
      SUMMER: ['летний'],
      ALL_SEASON: ['всесезонный'],
      SPRING_SUMMER: ['осенне-летний'],
      DEMI_SEASON: ['демисезонный'],
      SPRING_WINTER: ['осенне-зимний'],
      FALL: ['осенний'],
    },
  }

  private async getImportSource(id: string) {
    const importSource = await this.db.importSource.findUnique({
      where: { id },
    })

    if (!importSource) {
      throw new NotFoundException('Источник импорта не найден.')
    }

    return importSource
  }

  private getFileType(contentType?: string): ImportFileType {
    let importFileType: ImportFileType = 'OTHER'

    if (contentType === this.FILE_TYPES.XLSX) {
      importFileType = 'XLSX'
    } else if (contentType === this.FILE_TYPES.XLS) {
      importFileType = 'XLS'
    } else if (contentType === this.FILE_TYPES.CSV) {
      importFileType = 'CSV'
    }

    return importFileType
  }

  private async getImportFile(key: string) {
    const object = await this.storage.getObject(key)
    if (!object?.Body) return

    const chunks: any[] = []

    for await (const chunk of object.Body as Readable) {
      chunks.push(chunk)
    }

    return Buffer.concat(chunks)
  }

  private async readExcelFile(buffer: Buffer) {
    const workbook = xlsx.read(buffer, { type: 'buffer' })
    const workSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[workSheetName]
    return xlsx.utils.sheet_to_json(worksheet, { defval: '' })
  }

  private async readCSVFile(buffer: Buffer) {
    return new Promise((resolve, reject) => {
      const results: ImportProduct[] = []
      const columnCounts: Record<string, number> = {}
      const stream = Readable.from(buffer.toString())

      stream
        .pipe(csv())
        .on('headers', (headers) => {
          headers.forEach((header, index) => {
            if (columnCounts[header] === undefined) {
              columnCounts[header] = 0
            } else {
              columnCounts[header]++
              headers[index] = `${header}_${columnCounts[header]}`
            }
          })
        })
        .on('data', (data) => {
          results.push(data)
        })
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error))
    })
  }

  private async readImportData(
    contentType: string,
    key: string,
  ): Promise<any[]> {
    const buffer = await this.getImportFile(key)
    if (!buffer) throw new NotFoundException('Буфер данных импорта не найден.')

    if (contentType === 'CSV') {
      return this.readCSVFile(buffer) as unknown as any[]
    }

    if (contentType === 'XLSX' || contentType === 'XLS') {
      return this.readExcelFile(buffer) as unknown as any[]
    }

    throw new BadRequestException(
      `Данный тип файла импорта '${contentType}' не поддерживается.`,
    )
  }

  private transformData(
    schema: ImportItemSchema[],
    data: any[],
  ): ImportProduct[] {
    const result: ImportProduct[] = []
    let variants: ImportVariantFieldsType[] = []
    let lastProductId: string | undefined = undefined

    const productIdField = schema.find(
      (item) => item.field === ProductFields.PRODUCT_ID,
    )?.incomingFileField

    if (!productIdField) {
      throw new BadRequestException(
        'В схеме импорта отсутствует поле id товара.',
      )
    }

    // const additionalFieldsSchema = schema.filter(
    //   (item) => item.isAdditionalField === true,
    // )

    // const getAdditionalFields = (row: any): AdditionalField[] => {
    //   return Object.entries(row)
    //     .filter(([key]) => key.startsWith('Название_Характеристики_'))
    //     .map(([key, value]) => {
    //       const suffix = key.split('_').pop()
    //       const valueKey = `Значение_Характеристики_${suffix}`
    //       if (
    //         row[valueKey] &&
    //         additionalFieldsSchema.some(
    //           (item) => item.incomingFileField === String(value),
    //         )
    //       ) {
    //         return {
    //           key: String(value),
    //           value: String(row[valueKey]),
    //         }
    //       }
    //       return null
    //     })
    //     .filter(Boolean) as AdditionalField[]
    // }

    const getFieldData = <T>(
      row: any,
      prefix: string,
      schema: ImportItemSchema[],
    ): T => {
      return schema
        .filter((item) => item.field.startsWith(prefix))
        .reduce((acc, item) => {
          if (item.isAdditionalField === true) {
            const col = Object.entries(row).find(
              ([key, value]) =>
                key.startsWith('Название_Характеристики') &&
                schema.some(
                  (obj) =>
                    obj.isAdditionalField === true &&
                    obj.incomingFileField === String(value) &&
                    obj.field === item.field,
                ),
            )
            const key = col?.[0]
            if (key) {
              const suffix =
                key.split('_').length === 3 ? `_${key.split('_').pop()}` : ''
              const valueKey = `Значение_Характеристики${suffix}`

              acc[item.field] = String(row[valueKey])
            }
          } else {
            acc[item.field] = row[item.incomingFileField]
          }

          return acc
        }, {} as T)
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i]

      const variantData = getFieldData<ImportVariantFieldsType>(
        row,
        'variant_',
        schema,
      )
      const productData = getFieldData<ImportProductFieldsType>(
        row,
        'product_',
        schema,
      )

      const currentProductId = row[productIdField]

      if (lastProductId && currentProductId === lastProductId) {
        variants.push(variantData)
      } else {
        if (lastProductId !== undefined) {
          result[result.length - 1] = {
            ...result[result.length - 1],
            variants,
          }
        }
        variants = [variantData]

        const newProduct: ImportProduct = {
          ...productData,
          additionalFields: [],
          variants: [],
        }
        result.push(newProduct)
      }

      lastProductId = currentProductId
    }

    if (lastProductId !== undefined) {
      result[result.length - 1] = {
        ...result[result.length - 1],
        variants,
      }
    }

    return result
  }

  private IMPORT_SCHEMA_CACHE: {
    [key in ProductFields]?: ImportItemSchema
  } = {}

  private cacheSchemaItem(
    field: ProductFieldValues,
    schema: ImportItemSchema[],
    isOptional: boolean = false,
  ) {
    if (!this.IMPORT_SCHEMA_CACHE[field]) {
      const itemSchema = schema.find((obj) => obj.field === field)

      if (!itemSchema && !isOptional) {
        throw new NotFoundException(
          `Предоставленная схема импорта не включает: ${field}.`,
        )
      }

      if (itemSchema) {
        this.IMPORT_SCHEMA_CACHE[field] = itemSchema
      }
    }
  }

  private getValueFromAdditionalField(
    incomingFileField: string,
    data: ImportProduct,
  ) {
    const { additionalFields } = data
    return additionalFields.find((obj) => obj.key === incomingFileField)?.value
  }

  private getFieldRawValue(
    isAdditionalField: boolean,
    incomingFileField: string,
    field: ProductFields,
    product: ImportProduct,
  ) {
    return product[field]
  }

  private getFieldValue(
    schema: ImportItemSchema[],
    product: ImportProduct,
    field: ProductFields,
    isOptional: boolean = false,
  ) {
    this.cacheSchemaItem(field, schema, isOptional)
    const itemSchemaCache = this.IMPORT_SCHEMA_CACHE[field]

    if (itemSchemaCache) {
      const { isAdditionalField, incomingFileField } = itemSchemaCache

      return this.getFieldRawValue(
        isAdditionalField,
        incomingFileField,
        field,
        product,
      )
    }
  }

  private getFieldEnumValue(
    schema: ImportItemSchema[],
    product: ImportProduct,
    field: ProductFields,
    isOptional: boolean = false,
  ) {
    const value = this.getFieldValue(schema, product, field)
    const lowercaseStringValue = String(value).toLowerCase()

    for (const key of Object.keys(this.FIELD_VALUES[field])) {
      if (this.FIELD_VALUES[field][key].includes(lowercaseStringValue)) {
        return key
      }
    }

    if (!isOptional) {
      throw new NotFoundException(`Значение для ${field} не найдено.`)
    }
  }

  private getProductId(schema: ImportItemSchema[], product: ImportProduct) {
    return this.getFieldValue(schema, product, ProductFields.PRODUCT_ID)
  }

  private getProductTitle(schema: ImportItemSchema[], product: ImportProduct) {
    return this.getFieldValue(schema, product, ProductFields.PRODUCT_TITLE)
  }

  private getProductSku(schema: ImportItemSchema[], product: ImportProduct) {
    return this.getFieldValue(schema, product, ProductFields.PRODUCT_SKU)
  }

  private getProductSupplierSku(
    schema: ImportItemSchema[],
    product: ImportProduct,
  ) {
    return this.getFieldValue(
      schema,
      product,
      ProductFields.PRODUCT_SUPPLIER_SKU,
      true,
    )
  }

  private getProductTorgsoftId(
    schema: ImportItemSchema[],
    product: ImportProduct,
  ) {
    return this.getFieldValue(
      schema,
      product,
      ProductFields.PRODUCT_TORGSOFT_ID,
      true,
    )
  }

  private getProductPromId(schema: ImportItemSchema[], product: ImportProduct) {
    return this.getFieldValue(
      schema,
      product,
      ProductFields.PRODUCT_PROM_ID,
      true,
    )
  }

  private getProductRozetkaId(
    schema: ImportItemSchema[],
    product: ImportProduct,
  ) {
    return this.getFieldValue(
      schema,
      product,
      ProductFields.PRODUCT_ROZETKA_ID,
      true,
    )
  }

  private getProductMedia(schema: ImportItemSchema[], product: ImportProduct) {
    const data = this.getFieldValue(
      schema,
      product,
      ProductFields.PRODUCT_MEDIA,
      true,
    )

    if (!data) return

    return data.split(',')
  }

  private getProductGender(
    schema: ImportItemSchema[],
    product: ImportProduct,
  ): ProductGender {
    return (
      (this.getFieldEnumValue(
        schema,
        product,
        ProductFields.PRODUCT_GENDER,
        true,
      ) as ProductGender | undefined) ?? 'UNISEX'
    )
  }

  private getProductSeason(
    schema: ImportItemSchema[],
    product: ImportProduct,
  ): ProductSeason {
    return (
      (this.getFieldEnumValue(
        schema,
        product,
        ProductFields.PRODUCT_SEASON,
        true,
      ) as ProductSeason | undefined) ?? 'ALL_SEASON'
    )
  }

  private async createProduct(
    schema: ImportItemSchema[],
    product: ImportProduct,
    tx: PrismaTx,
  ) {
    const id = String(this.getProductId(schema, product))
    let sku = String(this.getProductSku(schema, product))

    const existingProduct = await tx.product.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    })
    if (existingProduct) return

    const productsCountWithSameSku = await tx.product.count({
      where: {
        sku: {
          startsWith: sku,
        },
      },
    })
    if (productsCountWithSameSku !== 0) {
      const newSku = `${sku}-${productsCountWithSameSku + 1}`
      sku = newSku
    }

    const mediaKeys: string[] | undefined = this.getProductMedia(
      schema,
      product,
    )

    return tx.product.create({
      data: {
        id,
        sku,
        supplierSku: this.getProductSupplierSku(schema, product),
        title: this.getProductTitle(schema, product) ?? '',
        gender: this.getProductGender(schema, product) ?? 'UNISEX',
        season: this.getProductSeason(schema, product) ?? 'ALL_SEASON',
        packagingHeight: 0,
        packagingLength: 0,
        packagingWeight: 0,
        packagingWidth: 0,
        torgsoftId: this.getProductTorgsoftId(schema, product) ?? undefined,
        rozetkaId: this.getProductRozetkaId(schema, product) ?? undefined,
        promId: this.getProductPromId(schema, product) ?? undefined,
        media:
          mediaKeys && mediaKeys.length >= 1
            ? {
                createMany: {
                  data: mediaKeys.map((key, i) => ({
                    index: i,
                    id: key,
                  })),
                },
              }
            : undefined,
      },
    })
  }

  private generateRandomNumber() {
    const min = 1 // Minimum 12-digit number is 1
    const max = 999999999999 // Maximum 12-digit number

    // Generate a random number between min and max (inclusive)
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min

    // Convert the number to a string and pad with leading zeros
    const paddedNumber = randomNumber.toString().padStart(12, '0')

    return paddedNumber
  }

  private async upsertVariants(
    schema: ImportItemSchema[],
    product: ImportProduct,
    tx: PrismaTx,
    warehouseId: string,
  ) {
    const productId = this.getProductId(schema, product)
    let totalProductQuantity = 0

    for (let i = 0; i < product.variants.length; i++) {
      const variant = product.variants[i]
      const id = String(variant[ProductFields.VARIANT_ID])
      const size = variant[ProductFields.VARIANT_SIZE]
      const price = Number(variant[ProductFields.VARIANT_PRICE])
      const sale = variant[ProductFields.VARIANT_SALE]
        ? Number(String(variant[ProductFields.VARIANT_SALE]).replace(/%/g, ''))
        : 0
      const torgsoftId = variant[ProductFields.VARIANT_TORGSOFT_ID]
      const promId = variant[ProductFields.VARIANT_PROM_ID]
      const rozetkaId = variant[ProductFields.VARIANT_ROZETKA_ID]
      const quantity = Number(variant[ProductFields.VARIANT_QUANTITY])
      const barcode = variant[ProductFields.VARIANT_BARCODE]
      totalProductQuantity += quantity

      const existingVariant = await tx.variant.findUnique({
        where: {
          id,
        },
        include: {
          warehouseStockEntries: true,
        },
      })

      if (existingVariant) {
        await tx.variant.update({
          where: {
            id,
          },
          data: {
            totalWarehouseQuantity: {
              increment: quantity,
            },
            sale,
            price,
          },
        })

        const existingWarehouseStockEntry =
          existingVariant.warehouseStockEntries.find(
            (obj) => obj.warehouseId === warehouseId,
          )

        if (existingWarehouseStockEntry) {
          await tx.variantToWarehouse.update({
            where: {
              id: existingWarehouseStockEntry.id,
            },
            data: {
              warehouseQuantity: {
                increment: quantity,
              },
            },
          })
        } else {
          await tx.variantToWarehouse.create({
            data: {
              variantId: existingVariant.id,
              warehouseId,
              warehouseQuantity: quantity,
            },
          })
        }
      } else {
        await tx.variant.create({
          data: {
            productId,
            id,
            size,
            price,
            sale,
            torgsoftId,
            promId,
            rozetkaId,
            totalReceivedQuantity: 0,
            totalWarehouseQuantity: quantity ?? 0,
            barcode: barcode ?? this.generateRandomNumber(),
            warehouseStockEntries: {
              create: {
                warehouseId,
                warehouseQuantity: quantity,
              },
            },
          },
        })
      }
    }

    await tx.product.update({
      where: {
        id: productId,
      },
      data: {
        totalWarehouseQuantity: {
          increment: totalProductQuantity,
        },
      },
    })
  }

  async createProductImport({
    fileKey,
    importSourceId,
    comment,
    warehouseId,
  }: CreateImportDto) {
    const [objectHeader, importSource, warehouse] = await Promise.all([
      this.storage.getHeader(fileKey),
      this.getImportSource(importSourceId),
      this.db.warehouse.findUnique({
        where: {
          id: warehouseId,
        },
      }),
    ])

    if (!warehouse) {
      throw new NotFoundException('Указанный вами склад не существует.')
    }

    if (!objectHeader) {
      throw new NotFoundException(
        'Метаданные файла импорта не найдены в хранилище.',
      )
    }

    const schema = importSource.schema as unknown as ImportItemSchema[] | null
    if (!schema) {
      throw new BadRequestException('Не предоставлена схема источника импорта.')
    }
    if (
      !schema.find((obj) => obj.field === ProductFields.PRODUCT_ID) ||
      !schema.find((obj) => obj.field === ProductFields.VARIANT_ID)
    ) {
      throw new BadRequestException(
        'Вы не указали соответствующие поля для идентификаторов продукта или варианта.',
      )
    }

    const importFileType = this.getFileType(objectHeader?.ContentType)
    await this.db.$transaction(
      async (tx) => {
        const [rawImportData] = await Promise.all([
          this.readImportData(importFileType, fileKey),
          tx.import.create({
            data: {
              file: {
                create: {
                  key: fileKey,
                  type: importFileType,
                },
              },
              type: 'PRODUCTS',
              importSourceId,
              comment,
              status: 'PENDING',
            },
          }),
        ])

        const parsedImportData = this.transformData(schema, rawImportData)
        for (let i = 0; i < parsedImportData.length; i++) {
          const product = parsedImportData[i]
          await this.createProduct(schema, product, tx)
          await this.upsertVariants(schema, product, tx, warehouseId)
        }
      },
      {
        timeout: minutes(5),
      },
    )
  }

  async findAllProductImports({
    page,
    rowsPerPage,
    query,
    orderBy,
  }: FindAllImportDto) {
    const { skip, take } = getPaginationData({ page, rowsPerPage })

    const where: Prisma.ImportWhereInput = {
      OR: buildContainsArray({
        fields: ['comment'],
        query,
      }),
      type: 'PRODUCTS',
    }

    const [items, totalItems] = await Promise.all([
      this.db.import.findMany({
        where,
        take,
        skip,
        orderBy: buildOrderByArray({ orderBy }),
      }),
      this.db.import.count({
        where,
      }),
    ])

    return {
      items,
      info: {
        totalPages: calculateTotalPages(totalItems, take),
        totalItems,
      },
    }
  }

  async findOneProductImport(id: string) {
    return this.db.import.findUnique({
      where: {
        id,
      },
    })
  }

  async findLastProductImport() {
    return this.db.import.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
      where: {
        type: 'PRODUCTS',
      },
    })
  }
}
