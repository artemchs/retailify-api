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
    return await this.db.color.create({
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

  async update(id: string, updateColorDto: UpdateColorDto) {
    await this.getColor(id)

    return await this.db.color.update({
      where: {
        id,
      },
      data: updateColorDto,
    })
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
