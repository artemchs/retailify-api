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

  beforeEach(async () => {
    await Promise.all([
      db.color.createMany({
        data: [
          {
            id: 'color_1',
            color: 'color_1',
            name: 'color_1',
          },
          {
            id: 'color_2',
            color: 'color_2',
            name: 'color_2',
          },
        ],
      }),
      db.category.create({
        data: {
          id: 'Test Category 1',
          name: 'Test Category 1',
          productName: 'Test Category 1',
        },
      }),
      db.brand.create({
        data: {
          id: 'Test Brand 1',
          name: 'Test Brand 1',
        },
      }),
    ])
  })

  describe('create', () => {
    const data: CreateProductDto = {
      title: 'Test Product 1',
      description: 'Test Product 1',
      colors: [
        {
          id: 'color_1',
          index: 0,
        },
        {
          id: 'color_2',
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
      categoryId: 'Test Category 1',
      brandId: 'Test Brand 1',
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

      const product = await db.product.findFirst({
        where: {
          title: data.title,
        },
      })

      expect(product?.sku).toBeDefined()
      expect(product?.sku).not.toBeNull()
      expect(product?.sku).toBe('TETECOSFU241')
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
            isArchived: false,
            price: 10.99,
            size: 'SM',
          },
          {
            isArchived: false,
            price: 10.99,
            size: 'XL',
          },
        ],
      })

      const product = await db.product.findFirst({
        where: {
          title: 'Test Product 1',
        },
        include: {
          variants: true,
        },
      })

      expect(product).toBeDefined()
      expect(product?.variants.length).toBe(2)
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
              name: 'Test Brand 1',
            },
          },
          category: {
            create: {
              name: 'Test Category 1',
              productName: 'Test Category 1',
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
      await Promise.all([
        db.product.create({
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
                    colorId: 'color_1',
                    index: 0,
                  },
                  {
                    colorId: 'color_2',
                    index: 1,
                  },
                ],
              },
            },
            gender: 'UNISEX',
            season: 'ALL_SEASON',
            sku: '1',
          },
        }),
        db.product.create({
          data: {
            id: 'Test Product 2',
            title: 'Test Product 2',
            description: 'Test Product 2',
            packagingHeight: 10,
            packagingLength: 10,
            packagingWeight: 10,
            packagingWidth: 10,
            colors: {
              createMany: {
                data: [
                  {
                    colorId: 'color_1',
                    index: 0,
                  },
                  {
                    colorId: 'color_2',
                    index: 1,
                  },
                ],
              },
            },
            gender: 'UNISEX',
            season: 'ALL_SEASON',
            sku: '2',
          },
        }),
        db.product.create({
          data: {
            id: 'Test Product 3',
            title: 'Test Product 3',
            description: 'Test Product 3',
            packagingHeight: 10,
            packagingLength: 10,
            packagingWeight: 10,
            packagingWidth: 10,
            colors: {
              createMany: {
                data: [
                  {
                    colorId: 'color_1',
                    index: 0,
                  },
                  {
                    colorId: 'color_2',
                    index: 1,
                  },
                ],
              },
            },
            gender: 'UNISEX',
            season: 'ALL_SEASON',
            sku: '3',
          },
        }),
      ])
    })

    it('should successfully edit many products', async () => {
      const data: BatchEditProductDto = {
        products: [
          {
            id: 'Test Product 1',
            packagingHeight: 12345,
          },
          {
            id: 'Test Product 2',
            packagingHeight: 12345,
          },
          {
            id: 'Test Product 3',
            packagingHeight: 12345,
          },
        ],
      }

      await service.batchEdit(data)

      const editedProductsCount = await db.product.count({
        where: {
          packagingHeight: 12345,
        },
      })

      expect(editedProductsCount).toBe(3)
    })

    it('should successfully edit with changed colors', async () => {
      await db.color.create({
        data: {
          id: 'New Color 1',
          color: 'New Color 1',
          name: 'New Color 1',
        },
      })

      const data: BatchEditProductDto = {
        products: [
          {
            id: 'Test Product 1',
            colors: [
              {
                id: 'New Color 1',
                index: 0,
              },
            ],
          },
          {
            id: 'Test Product 2',
            colors: [
              {
                id: 'New Color 1',
                index: 0,
              },
            ],
          },
          {
            id: 'Test Product 3',
            colors: [
              {
                id: 'New Color 1',
                index: 0,
              },
            ],
          },
        ],
      }

      await service.batchEdit(data)

      const products = await db.product.findMany({
        select: {
          colors: {
            select: {
              index: true,
              colorId: true,
            },
          },
        },
      })

      expect(products.length).toBe(3)
      for (const product of products) {
        expect(product.colors[0].index).toBe(0)
        expect(product.colors[0].colorId).toBe('New Color 1')
        expect(product.colors[1]).toBeUndefined()
      }
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
                  colorId: 'color_1',
                  index: 0,
                },
                {
                  colorId: 'color_2',
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
      title: 'Updated Test Product 1',
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

      expect(product?.title).toBe(data.title)
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
      await db.color.create({
        data: {
          id: 'color_3',
          color: 'color_3',
          name: 'color_3',
        },
      })

      await service.update(id, {
        ...data,
        colors: [
          {
            id: 'color_1',
            index: 0,
          },
          {
            id: 'color_2',
            index: 1,
          },
          {
            id: 'color_3',
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
      const colorsCount = await db.color.count()

      expect(product?.colors.length).toBe(3)
      expect(productsToColorsCount).toBe(3)
      expect(colorsCount).toBe(3)
    })

    it('should handle the case when one color is no longer used', async () => {
      await service.update(id, {
        ...data,
        colors: [
          {
            id: 'color_1',
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
      const colorsCount = await db.color.count()

      expect(product?.colors.length).toBe(1)
      expect(productsToColorsCount).toBe(1)
      expect(colorsCount).toBe(2)
    })

    it('should handle the case when color indexes have been changed', async () => {
      await service.update(id, {
        ...data,
        colors: [
          {
            id: 'color_1',
            index: 1,
          },
          {
            id: 'color_2',
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
      const colorsCount = await db.color.count()

      expect(product?.colors.length).toBe(2)
      expect(product?.colors[0].colorId).toBe('color_2')
      expect(productsToColorsCount).toBe(2)
      expect(colorsCount).toBe(2)
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
      await service.update(id, { ...data, characteristicValues: [] })

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
        characteristicValues: [
          {
            id: 'Test Value 1',
          },
          {
            id: 'Test Value 2',
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
            isArchived: false,
            price: 10.99,
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
            },
          },
        },
      })

      await service.update(id, {
        ...data,
        variants: [
          {
            id: 'Test Variant 1',
            isArchived: false,
            price: 10.99,
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
          categoryId: 'Test Category 1',
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
          categoryId: 'Test Category 1',
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
