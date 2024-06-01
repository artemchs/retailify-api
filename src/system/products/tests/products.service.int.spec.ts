import { Test } from '@nestjs/testing'
import { DbService } from '../../../db/db.service'
import { ProductsService } from '../products.service'
import { AppModule } from '../../../app.module'
import { CreateProductDto } from '../dto/create-product.dto'
import { FindAllProductDto } from '../dto/findAll-product.dto'
import { NotFoundException } from '@nestjs/common'
import { UpdateProductDto } from '../dto/update-product.dto'
import { StorageService } from '../../storage/storage.service'
import { ListObjectsV2Command } from '@aws-sdk/client-s3'
import { BatchEditProductDto } from '../dto/batch-edit-product.dto'
import { ProductGender, ProductSeason } from '@prisma/client'

describe('ProductsService', () => {
  let service: ProductsService
  let storage: StorageService
  let db: DbService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    db = moduleRef.get(DbService)
    service = moduleRef.get(ProductsService)
    storage = moduleRef.get(StorageService)

    await Promise.all([db.reset(), storage.reset()])
  })

  afterEach(async () => {
    await Promise.all([db.reset(), storage.reset()])
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  const ids = {
    colors: {
      1: 'Color 1',
      2: 'Color 2',
      3: 'Color 3',
      4: 'Color 4',
    },
    categories: {
      1: 'Category 1',
      2: 'Category 2',
      3: 'Category 3',
      4: 'Category 4',
    },
    brands: {
      1: 'Brand 1',
      2: 'Brand 2',
      3: 'Brand 3',
      4: 'Brand 4',
    },
  }

  beforeEach(async () => {
    await Promise.all([
      db.color.createMany({
        data: Object.values(ids.colors).map((val) => ({
          id: val,
          name: val,
          color: val,
        })),
      }),
      db.category.createMany({
        data: Object.values(ids.categories).map((val) => ({
          id: val,
          name: val,
          productName: val,
        })),
      }),
      db.brand.createMany({
        data: Object.values(ids.brands).map((val) => ({
          id: val,
          name: val,
        })),
      }),
    ])
  })

  describe('create', () => {
    const data: CreateProductDto = {
      description: 'Test Product 1',
      supplierSku: 'asdfasdfasdfasdf',
      colors: [
        {
          id: ids.colors[1],
          index: 0,
        },
        {
          id: ids.colors[2],
          index: 1,
        },
      ],
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
      gender: 'UNISEX',
      season: 'SPRING_FALL',
      categoryId: ids.categories[1],
      brandId: ids.brands[1],
    }

    it('should successfully create a new product', async () => {
      await service.create(data)

      const productsCount = await db.product.count()

      expect(productsCount).toBe(1)
    })

    it('should correctly create product-to-color connections', async () => {
      await service.create(data)

      const productsToColorsCount = await db.productToColor.count()

      expect(productsToColorsCount).toBe(2)
    })

    it('should add media to the db', async () => {
      await service.create(data)

      const productMediaCount = await db.productMedia.count()

      expect(productMediaCount).toBe(2)
    })

    it('should correctly generate the sku field', async () => {
      await service.create(data)

      const product = await db.product.findFirst()

      expect(product?.sku).toBeDefined()
      expect(product?.sku).not.toBeNull()
      expect(product?.sku).toBe('00001')
    })

    it('should correctly increment sku unique field', async () => {
      await service.create({ ...data, media: [] })
      await service.create({ ...data, media: [] })
      await service.create({ ...data, media: [] })

      const products = await db.product.count()

      expect(products).toBe(3)
    })

    it('should correctly create variants', async () => {
      await service.create({
        ...data,
        variants: [
          {
            size: 'SM',
          },
          {
            size: 'XL',
          },
        ],
      })

      const product = await db.product.findFirst({
        include: {
          variants: true,
        },
      })

      expect(product).toBeDefined()
      expect(product?.variants.length).toBe(2)
    })

    it('should correctly connect with variant attributes', async () => {
      await db.additionalAttribute.create({
        data: {
          id: 'attribute',
          name: 'asdf',
        },
      })

      await service.create({
        ...data,
        variants: [
          {
            size: 'SM',
            additionalAttributes: [
              {
                id: 'attribute',
                value: 'a;sdjasdf',
              },
            ],
          },
        ],
      })

      const variantAttributeCount = await db.variantAdditionalAttribute.count()

      expect(variantAttributeCount).toBe(1)
    })
  })

  describe('findAll', () => {
    beforeEach(async () => {
      await db.product.createMany({
        data: [
          {
            id: 'Test Product 1',
            title: 'Test Product 1',
            description: 'Test Product 1',
            packagingHeight: 10,
            packagingLength: 10,
            packagingWeight: 10,
            packagingWidth: 10,
            gender: 'UNISEX',
            season: 'ALL_SEASON',
            sku: '1',
          },
          {
            id: 'Test Product 2',
            title: 'Test Product 2',
            description: 'Test Product 2',
            packagingHeight: 20,
            packagingLength: 20,
            packagingWeight: 20,
            packagingWidth: 20,
            gender: 'UNISEX',
            season: 'ALL_SEASON',
            sku: '2',
          },
          {
            id: 'Test Product 3',
            title: 'Test Product 3',
            description: 'Test Product 3',
            packagingHeight: 30,
            packagingLength: 30,
            packagingWeight: 30,
            packagingWidth: 30,
            gender: 'UNISEX',
            season: 'ALL_SEASON',
            sku: '3',
          },
          {
            id: 'Test Product 4',
            title: 'Test Product 4',
            description: 'Test Product 4',
            packagingHeight: 40,
            packagingLength: 40,
            packagingWeight: 40,
            packagingWidth: 40,
            isArchived: true,
            gender: 'UNISEX',
            season: 'ALL_SEASON',
            sku: '4',
          },
        ],
      })
    })

    const data: FindAllProductDto = {
      page: 1,
      rowsPerPage: 10,
      orderBy: undefined,
      query: undefined,
    }

    it('should list all products that are not archived', async () => {
      const { items } = await service.findAll(data)

      expect(items.length).toBe(3)
    })

    it('should return correct pagination info', async () => {
      const { info } = await service.findAll(data)

      expect(info.totalItems).toBe(3)
      expect(info.totalPages).toBe(1)
    })

    it('should filter items by name query', async () => {
      const { info } = await service.findAll({
        ...data,
        query: 'Test Product 1',
      })

      expect(info.totalItems).toBe(1)
    })
  })

  describe('findOne', () => {
    beforeEach(async () => {
      await db.product.create({
        data: {
          id: 'Test Product 1',
          title: 'Test Product 1',
          description: 'Test Product 1',
          packagingHeight: 10,
          packagingLength: 10,
          packagingWeight: 10,
          packagingWidth: 10,
          gender: 'UNISEX',
          season: 'ALL_SEASON',
          brand: {
            create: {
              name: ids.brands[1],
            },
          },
          category: {
            connect: {
              id: ids.categories[1],
            },
          },
          characteristicValues: {
            create: {
              value: 'Test Characteristic Value 1',
            },
          },
          variants: {
            create: {
              price: 10,
              size: 'XL',
              totalReceivedQuantity: 0,
              totalWarehouseQuantity: 0,
              barcode: 'asdf',
            },
          },
          sku: '1',
        },
      })
    })

    const id = 'Test Product 1'

    it('should find the requested product', async () => {
      const res = await service.findOne(id)

      expect(res.id).toBe(id)
    })

    it('should throw an exception if the product does not exist', async () => {
      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('batchEdit', () => {
    beforeEach(async () => {
      await db.product.createMany({
        data: [
          {
            id: 'Product1',
            brandId: ids.brands[1],
            categoryId: ids.categories[1],
            gender: 'UNISEX',
            season: 'SUMMER',
            packagingHeight: 10,
            packagingLength: 10,
            packagingWeight: 10,
            packagingWidth: 10,
            supplierSku: 'SKU1',
            sku: 'Product1',
            title: 'Product1',
          },
          {
            id: 'Product2',
            brandId: ids.brands[1],
            categoryId: ids.categories[1],
            gender: 'FEMALE',
            season: 'WINTER',
            packagingHeight: 20,
            packagingLength: 20,
            packagingWeight: 20,
            packagingWidth: 20,
            supplierSku: 'SKU2',
            sku: 'Product2',
            title: 'Product2',
          },
        ],
      })
    })

    it('should successfully batch edit products', async () => {
      const dto: BatchEditProductDto = {
        productIds: ['Product1', 'Product2'],
        brandId: ids.brands[2],
        categoryId: ids.categories[2],
        gender: ProductGender.UNISEX,
        season: ProductSeason.SPRING_FALL,
        packagingHeight: 30,
        packagingLength: 30,
        packagingWeight: 30,
        packagingWidth: 30,
        supplierSku: 'UpdatedSKU',
        colors: [
          { id: ids.colors[3], index: 0 },
          { id: ids.colors[4], index: 1 },
        ],
      }

      await service.batchEdit(dto)

      const products = await db.product.findMany({
        where: { id: { in: dto.productIds } },
        include: { colors: true },
      })

      products.forEach((product) => {
        expect(product.brandId).toBe(dto.brandId)
        expect(product.categoryId).toBe(dto.categoryId)
        expect(product.gender).toBe(dto.gender)
        expect(product.season).toBe(dto.season)
        expect(Number(product.packagingHeight)).toBe(dto.packagingHeight)
        expect(Number(product.packagingLength)).toBe(dto.packagingLength)
        expect(Number(product.packagingWeight)).toBe(dto.packagingWeight)
        expect(Number(product.packagingWidth)).toBe(dto.packagingWidth)
        expect(product.supplierSku).toBe(dto.supplierSku)
      })

      const productToColors = await db.productToColor.findMany({
        where: { productId: { in: dto.productIds } },
      })

      expect(productToColors.length).toBe(4) // 2 products with 2 colors each
    })

    it('should correctly update titles', async () => {
      const dto: BatchEditProductDto = {
        productIds: ['Product1', 'Product2'],
        brandId: ids.brands[4],
      }

      await service.batchEdit(dto)

      const products = await db.product.findMany({
        where: { id: { in: dto.productIds } },
      })

      for (const { title } of products) {
        expect(title.includes(ids.brands[4])).toBeTruthy()
      }
    })

    it('should handle partial edit without changing colors', async () => {
      const dto: BatchEditProductDto = {
        productIds: ['Product1', 'Product2'],
        brandId: ids.brands[2],
        packagingHeight: 15,
      }

      await service.batchEdit(dto)

      const products = await db.product.findMany({
        where: { id: { in: dto.productIds } },
      })

      products.forEach((product) => {
        expect(product.brandId).toBe(dto.brandId)
        expect(Number(product.packagingHeight)).toBe(dto.packagingHeight)
      })

      const productToColorsCount = await db.productToColor.count()
      expect(productToColorsCount).toBe(0) // No colors updated
    })

    it('should handle edit with no changes', async () => {
      const dto: BatchEditProductDto = {
        productIds: ['Product1', 'Product2'],
      }

      await service.batchEdit(dto)

      const products = await db.product.findMany({
        where: { id: { in: dto.productIds } },
      })

      products.forEach((product) => {
        expect(product.brandId).not.toBe('UpdatedBrand')
        expect(product.packagingHeight).not.toBe(30)
      })

      const productToColorsCount = await db.productToColor.count()
      expect(productToColorsCount).toBe(0) // No colors updated
    })

    it('should fail if something does not exist', async () => {
      const dto: BatchEditProductDto = {
        productIds: ['NonExistentProduct'],
        brandId: 'NonExistentBrand',
      }

      await expect(service.batchEdit(dto)).rejects.toThrow(NotFoundException)
    })

    it('should handle invalid color data', async () => {
      const dto: BatchEditProductDto = {
        productIds: ['Product1'],
        colors: [{ id: 'InvalidColor', index: 0 }],
      }

      await expect(service.batchEdit(dto)).rejects.toThrow()
    })

    it('should reset and update colors correctly', async () => {
      const dto: BatchEditProductDto = {
        productIds: ['Product1', 'Product2'],
        colors: [
          { id: ids.colors[3], index: 0 },
          { id: ids.colors[4], index: 1 },
        ],
      }

      await service.batchEdit(dto)

      const productToColors = await db.productToColor.findMany({
        where: { productId: { in: dto.productIds } },
      })

      expect(productToColors.length).toBe(4) // 2 products with 2 colors each
      expect(productToColors.some((p) => p.colorId === ids.colors[1])).toBe(
        false,
      )
      expect(productToColors.some((p) => p.colorId === ids.colors[1])).toBe(
        false,
      )
    })

    it('should handle database update errors gracefully', async () => {
      jest.spyOn(db.product, 'updateMany').mockImplementationOnce(() => {
        throw new Error('Database error')
      })

      const dto: BatchEditProductDto = {
        productIds: ['Product1', 'Product2'],
        brandId: 'BrandWithError',
      }

      await expect(service.batchEdit(dto)).rejects.toThrow('Database error')
    })
  })

  describe('update', () => {
    beforeEach(async () => {
      await db.product.create({
        data: {
          id: 'Test Product 1',
          title: 'Test Product 1',
          description: 'Test Product 1',
          packagingHeight: 10,
          packagingLength: 10,
          packagingWeight: 10,
          packagingWidth: 10,
          colors: {
            createMany: {
              data: [
                {
                  colorId: ids.colors[1],
                  index: 0,
                },
                {
                  colorId: ids.colors[2],
                  index: 1,
                },
              ],
            },
          },
          media: {
            createMany: {
              data: [
                {
                  id: 'media_1',
                  index: 0,
                },
                {
                  id: 'media_2',
                  index: 1,
                },
              ],
            },
          },
          characteristicValues: {
            create: {
              id: 'Test Value 1',
              value: 'Test Value 1',
            },
          },
          gender: 'UNISEX',
          season: 'ALL_SEASON',
          sku: '1',
        },
      })
    })

    const id = 'Test Product 1'

    const data: UpdateProductDto = {
      supplierSku: 'Updated Test Product 1',
    }

    it('should successfully update the requested product', async () => {
      await service.update(id, data)

      const product = await db.product.findUnique({
        where: {
          id,
        },
        include: {
          colors: true,
          media: true,
        },
      })

      expect(product?.supplierSku).toBe(data.supplierSku)
    })

    it('should leave unchanged fields as they were', async () => {
      await service.update(id, data)

      const product = await db.product.findUnique({
        where: {
          id,
        },
        include: {
          colors: true,
          media: true,
        },
      })

      expect(product?.description).toBe('Test Product 1')
      expect(product?.colors.length).toBe(2)
      expect(product?.media.length).toBe(2)
    })

    it('should select an another color', async () => {
      await service.update(id, {
        ...data,
        colors: [
          {
            id: ids.colors[1],
            index: 0,
          },
          {
            id: ids.colors[2],
            index: 1,
          },
          {
            id: ids.colors[3],
            index: 2,
          },
        ],
      })

      const product = await db.product.findUnique({
        where: {
          id,
        },
        include: {
          colors: true,
        },
      })
      const productsToColorsCount = await db.productToColor.count()

      expect(product?.colors.length).toBe(3)
      expect(productsToColorsCount).toBe(3)
    })

    it('should handle the case when one color is no longer used', async () => {
      await service.update(id, {
        ...data,
        colors: [
          {
            id: ids.colors[1],
            index: 0,
          },
        ],
      })

      const product = await db.product.findUnique({
        where: {
          id,
        },
        include: {
          colors: true,
        },
      })
      const productsToColorsCount = await db.productToColor.count()

      expect(product?.colors.length).toBe(1)
      expect(productsToColorsCount).toBe(1)
    })

    it('should handle the case when color indexes have been changed', async () => {
      await service.update(id, {
        ...data,
        colors: [
          {
            id: ids.colors[1],
            index: 1,
          },
          {
            id: ids.colors[2],
            index: 0,
          },
        ],
      })

      const product = await db.product.findUnique({
        where: {
          id,
        },
        include: {
          colors: {
            orderBy: {
              index: 'asc',
            },
          },
        },
      })
      const productsToColorsCount = await db.productToColor.count()

      expect(product?.colors.length).toBe(2)
      expect(product?.colors[0].colorId).toBe(ids.colors[2])
      expect(productsToColorsCount).toBe(2)
    })

    it('should add a media file', async () => {
      await service.update(id, {
        ...data,
        media: [
          {
            id: 'media_1',
            index: 0,
          },
          {
            id: 'media_2',
            index: 1,
          },
          {
            id: 'media_3',
            index: 2,
          },
        ],
      })

      const product = await db.product.findUnique({
        where: {
          id,
        },
        include: {
          media: true,
        },
      })
      const productMediaCount = await db.productMedia.count()

      expect(product?.media.length).toBe(3)
      expect(productMediaCount).toBe(3)
    })

    it('should handle the case when one media file is no longer used', async () => {
      await storage.uploadFile('media_2', Buffer.from('Hello World'))

      await service.update(id, {
        ...data,
        media: [
          {
            id: 'media_1',
            index: 0,
          },
        ],
      })

      const product = await db.product.findUnique({
        where: {
          id,
        },
        include: {
          media: true,
        },
      })
      const productMediaCount = await db.productMedia.count()
      const { Contents } = await storage.send(
        new ListObjectsV2Command({ Bucket: 'test' }),
      )

      expect(product?.media.length).toBe(1)
      expect(productMediaCount).toBe(1)
      expect(Contents).toBeUndefined()
    })

    it('should handle the case when media indexes have been changed', async () => {
      await service.update(id, {
        ...data,
        media: [
          {
            id: 'media_1',
            index: 1,
          },
          {
            id: 'media_2',
            index: 0,
          },
        ],
      })

      const product = await db.product.findUnique({
        where: {
          id,
        },
        include: {
          media: {
            orderBy: {
              index: 'asc',
            },
          },
        },
      })
      const productMediaCount = await db.productMedia.count()

      expect(product?.media[0].id).toBe('media_2')
      expect(productMediaCount).toBe(2)
    })

    it('should handle the case when the user de-selects a characteristic value', async () => {
      await service.update(id, { ...data, characteristics: [] })

      const product = await db.product.findUnique({
        where: {
          id,
        },
        include: {
          characteristicValues: true,
        },
      })
      const characteristicValuesCount = await db.characteristicValue.count()

      expect(product?.characteristicValues.length).toBe(0)
      expect(characteristicValuesCount).toBe(1)
    })

    it('should be able to select new characteristic values', async () => {
      await db.characteristicValue.create({
        data: {
          id: 'Test Value 2',
          value: 'Test Value 2',
        },
      })

      await service.update(id, {
        ...data,
        // characteristicValues: [
        //   {
        //     id: 'Test Value 1',
        //   },
        //   {
        //     id: 'Test Value 2',
        //   },
        // ],
        characteristics: [
          {
            id: 'asdfasdf',
            values: [
              {
                id: 'Test Value 1',
              },
              {
                id: 'Test Value 2',
              },
            ],
          },
        ],
      })

      const product = await db.product.findUnique({
        where: {
          id,
        },
        include: {
          characteristicValues: true,
        },
      })
      const characteristicValuesCount = await db.characteristicValue.count()

      expect(product?.characteristicValues.length).toBe(2)
      expect(characteristicValuesCount).toBe(2)
    })

    it('should correctly add a new variant', async () => {
      await service.update(id, {
        ...data,
        variants: [
          {
            size: 'SM',
          },
        ],
      })

      const product = await db.product.findFirst({
        include: {
          variants: true,
        },
      })

      expect(product?.variants.length).toBe(1)
    })

    it('should update an existing variant', async () => {
      await db.product.update({
        where: {
          id: 'Test Product 1',
        },
        data: {
          variants: {
            create: {
              id: 'Test Variant 1',
              price: 10.99,
              size: 'SM',
              totalReceivedQuantity: 0,
              totalWarehouseQuantity: 0,
              barcode: 'asdf',
            },
          },
        },
      })

      await service.update(id, {
        ...data,
        variants: [
          {
            id: 'Test Variant 1',
            size: 'XL',
          },
        ],
      })

      const products = await db.product.count()
      const updatedVariant = await db.variant.findUnique({
        where: {
          id: 'Test Variant 1',
        },
      })

      expect(products).toBe(1)
      expect(updatedVariant?.size).toBe('XL')
    })

    it('should update an existing additional attribute', async () => {
      await db.product.update({
        where: {
          id: 'Test Product 1',
        },
        data: {
          variants: {
            create: {
              id: 'Test Variant 1',
              price: 10.99,
              size: 'SM',
              totalReceivedQuantity: 0,
              totalWarehouseQuantity: 0,
              barcode: 'asdf',
              additionalAttributes: {
                create: {
                  value: '1',
                  additionalAttribute: {
                    create: {
                      id: 'attribute',
                      name: 'asdf',
                    },
                  },
                },
              },
            },
          },
        },
      })

      await service.update(id, {
        ...data,
        variants: [
          {
            id: 'Test Variant 1',
            size: 'XL',
            additionalAttributes: [
              {
                id: 'attribute',
                value: 'updatedValue',
              },
            ],
          },
        ],
      })

      const variantAdditionalAttribute =
        await db.variantAdditionalAttribute.findFirst()

      expect(variantAdditionalAttribute?.value).toBe('updatedValue')
      expect(variantAdditionalAttribute?.additionalAttributeId).toBe(
        'attribute',
      )
    })

    it('should fail if the product does not exist', async () => {
      await expect(service.update('non-existent', data)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('archive', () => {
    beforeEach(async () => {
      await db.product.create({
        data: {
          id: 'Test Product 1',
          title: 'Test Product 1',
          description: 'Test Product 1',
          packagingHeight: 10,
          packagingLength: 10,
          packagingWeight: 10,
          packagingWidth: 10,
          categoryId: ids.categories[1],
          gender: 'UNISEX',
          season: 'ALL_SEASON',
          sku: '1',
        },
      })
    })

    const id = 'Test Product 1'

    it('should successfully archive the requested product', async () => {
      await service.archive(id)

      const productsCount = await db.product.count()
      const product = await db.product.findUnique({
        where: {
          id,
        },
      })

      expect(productsCount).toBe(1)
      expect(product?.isArchived).toBeTruthy()
    })

    it('should fail if the requested product does not exist', async () => {
      await expect(service.archive('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('restore', () => {
    beforeEach(async () => {
      await db.product.create({
        data: {
          id: 'Test Product 1',
          title: 'Test Product 1',
          description: 'Test Product 1',
          packagingHeight: 10,
          packagingLength: 10,
          packagingWeight: 10,
          packagingWidth: 10,
          categoryId: ids.categories[1],
          gender: 'UNISEX',
          season: 'ALL_SEASON',
          sku: '1',
        },
      })
    })

    const id = 'Test Product 1'

    it('should successfully restore the requested product', async () => {
      await service.restore(id)

      const productsCount = await db.product.count()
      const product = await db.product.findUnique({
        where: {
          id,
        },
      })

      expect(productsCount).toBe(1)
      expect(product?.isArchived).toBeFalsy()
    })

    it('should fail if the requested product does not exist', async () => {
      await expect(service.restore('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
