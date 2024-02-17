import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CreateColorDto } from './dto/create-color.dto'
import { UpdateColorDto } from './dto/update-color.dto'
import { DbService } from '../../db/db.service'
import { FindAllColorDto } from './dto/findAll-color.dto'
import { Prisma } from '@prisma/client'
import { buildContainsArray } from '../common/utils/db-helpers'
import { slugify } from 'transliteration'
import { replaceCharacters } from '../common/utils/replace-characters'

@Injectable()
export class ColorsService {
  constructor(private db: DbService) {}

  private async getColor(id: string) {
    const color = await this.db.color.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            productsToColors: true,
          },
        },
      },
    })

    if (!color) {
      throw new NotFoundException('Цвет не найден.')
    }

    return color
  }

  async create(createColorDto: CreateColorDto) {
    await this.db.color.create({
      data: createColorDto,
    })
  }

  async findAll({ cursor, query }: FindAllColorDto) {
    const limit = 10

    const where: Prisma.ColorWhereInput = {
      OR: buildContainsArray({ fields: ['name', 'color'], query }),
    }

    const items = await this.db.color.findMany({
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
    const color = await this.getColor(id)

    return color
  }

  private async updateProductSkus(
    colorId: string,
    oldName: string,
    newName?: string,
  ) {
    if (newName && oldName !== newName) {
      const colorCode = slugify(newName, {
        uppercase: true,
      })
        .slice(0, 2)
        .padEnd(2, '_')

      await this.db.$transaction(async (tx) => {
        const products = await tx.product.findMany({
          where: {
            colors: {
              some: {
                colorId,
                index: 0,
              },
            },
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
                sku: replaceCharacters(sku, 4, 5, colorCode),
              },
            }),
          ),
        )
      })
    }
  }

  async update(id: string, updateColorDto: UpdateColorDto) {
    const color = await this.getColor(id)

    await Promise.all([
      this.db.color.update({
        where: {
          id,
        },
        data: updateColorDto,
      }),
      this.updateProductSkus(color.id, color.name, updateColorDto.name),
    ])
  }

  async remove(id: string) {
    const color = await this.getColor(id)

    if (color._count.productsToColors >= 1) {
      throw new BadRequestException(
        `Невозможно удалить цвет. Существует связь с ${color._count.productsToColors} товарами. Пожалуйста, удалите все связи с этим цветом перед его удалением.`,
      )
    }

    await this.db.color.delete({
      where: {
        id,
      },
    })
  }
}
