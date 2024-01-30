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

  async update(id: string, updateBrandDto: UpdateBrandDto) {
    await this.getBrand(id)

    await this.db.brand.update({
      where: {
        id,
      },
      data: updateBrandDto,
    })
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
