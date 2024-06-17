import { Injectable, NotFoundException } from '@nestjs/common'
import { CreateProductTagDto } from './dto/create-product-tag.dto'
import { UpdateProductTagDto } from './dto/update-product-tag.dto'
import { DbService } from '../../db/db.service'
import { FindAllProductTagDto } from './dto/findAll-product-tag.dto'
import { Prisma } from '@prisma/client'
import { buildContainsArray } from '../common/utils/db-helpers'
import { DEFAULT_PRISMA_LIMIT } from '../common/constants'

@Injectable()
export class ProductTagsService {
  constructor(private db: DbService) {}

  private async getProductTag(id: string) {
    const tag = await this.db.productTag.findUnique({
      where: {
        id,
      },
    })

    if (!tag) {
      throw new NotFoundException('Тег не найден.')
    }

    return tag
  }

  async create(createProductTagDto: CreateProductTagDto) {
    return await this.db.productTag.create({
      data: createProductTagDto,
    })
  }

  async findAll({ cursor, query }: FindAllProductTagDto) {
    const where: Prisma.ProductTagWhereInput = {
      OR: buildContainsArray({ fields: ['name'], query }),
    }

    const items = await this.db.productTag.findMany({
      take: DEFAULT_PRISMA_LIMIT + 1,
      where,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    })

    let nextCursor: typeof cursor | undefined = undefined
    if (items.length > DEFAULT_PRISMA_LIMIT) {
      const nextItem = items.pop()
      nextCursor = nextItem!.id
    }

    return {
      items,
      nextCursor,
    }
  }

  async findOne(id: string) {
    const tag = await this.getProductTag(id)

    return tag
  }

  async update(id: string, updateProductTagDto: UpdateProductTagDto) {
    await this.getProductTag(id)

    return await this.db.productTag.update({
      where: {
        id,
      },
      data: updateProductTagDto,
    })
  }

  async remove(id: string) {
    await this.getProductTag(id)

    await this.db.productTag.delete({
      where: {
        id,
      },
    })
  }
}
