import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CreateBrandDto } from './dto/create-brand.dto'
import { UpdateBrandDto } from './dto/update-brand.dto'
import { DbService } from '../../db/db.service'
import { FindAllBrandDto } from './dto/findAll-brand.dto'
import { Prisma } from '@prisma/client'
import { buildContainsArray } from '../common/utils/db-helpers'
import { slugify } from 'transliteration'
import { replaceCharacters } from '../common/utils/replace-characters'

@Injectable()
export class BrandsService {
  constructor(private db: DbService) {}

  private async getBrand(id: string) {
    const brand = await this.db.brand.findUnique({
      where: {
        id,
      },
    })

    if (!brand) {
      throw new NotFoundException('Бренд не найден.')
    }

    return brand
  }

  async create(createBrandDto: CreateBrandDto) {
    await this.db.brand.create({
      data: createBrandDto,
    })
  }

  async findAll({ cursor, query }: FindAllBrandDto) {
    const limit = 10

    const where: Prisma.BrandWhereInput = {
      OR: buildContainsArray({ fields: ['name'], query }),
    }

    const items = await this.db.brand.findMany({
      take: limit + 1,
      where,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    })

    let nextCursor: typeof cursor | undefined = undefined
    if (items.length > limit) {
      const nextItem = items.pop()
      nextCursor = nextItem!.id
    }

    return {
      items,
      nextCursor,
    }
  }

  async findOne(id: string) {
    const brand = await this.getBrand(id)

    return brand
  }

  private async updateProductSkus(
    brandId: string,
    oldName: string,
    newName?: string,
  ) {
    if (newName && oldName !== newName) {
      const brandCode = slugify(newName, {
        uppercase: true,
      })
        .slice(0, 2)
        .padEnd(2, '_')

      await this.db.$transaction(async (tx) => {
        const products = await tx.product.findMany({
          where: {
            brandId,
          },
          select: {
            id: true,
            sku: true,
          },
        })

        await Promise.all(
          products.map(({ id, sku }) =>
            tx.product.update({
              where: {
                id,
              },
              data: {
                sku: replaceCharacters(sku, 0, 1, brandCode),
              },
            }),
          ),
        )
      })
    }
  }

  async update(id: string, updateBrandDto: UpdateBrandDto) {
    const brand = await this.getBrand(id)

    await Promise.all([
      this.db.brand.update({
        where: {
          id,
        },
        data: updateBrandDto,
      }),
      this.updateProductSkus(brand.id, brand.name, updateBrandDto.name),
    ])
  }

  async remove(id: string) {
    await this.getBrand(id)
    const productsCount = await this.db.product.count({
      where: {
        brandId: id,
      },
    })

    if (productsCount >= 1) {
      throw new BadRequestException(
        `Невозможно удалить бренд, так как ${productsCount} товар(ов) привязаны к нему.`,
      )
    }

    await this.db.brand.delete({
      where: {
        id,
      },
    })
  }
}
