import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CreateValueDto } from './dto/create-value.dto'
import { UpdateValueDto } from './dto/update-value.dto'
import { DbService } from '../../../db/db.service'
import { FindAllCharacteristicValueDto } from './dto/findAll-value.dto'
import { Prisma } from '@prisma/client'
import { buildContainsArray } from '../../common/utils/db-helpers'

@Injectable()
export class ValuesService {
  constructor(private db: DbService) {}

  private async getValue(characteristicId: string, id: string) {
    const [characteristic, value] = await Promise.all([
      this.db.characteristic.findUnique({
        where: {
          id: characteristicId,
        },
      }),
      this.db.characteristicValue.findUnique({
        where: {
          id,
        },
      }),
    ])

    if (!value) {
      throw new NotFoundException('Значение характеристики не найдено.')
    }

    if (!characteristic) {
      throw new NotFoundException('Характеристика не найдена.')
    }

    return value
  }

  private async getProductsCountForValue(id: string) {
    const count = await this.db.product.count({
      where: {
        characteristicValues: {
          some: {
            id,
          },
        },
      },
    })

    return count
  }

  async create(characteristicId: string, createValueDto: CreateValueDto) {
    await this.db.characteristicValue.create({
      data: {
        ...createValueDto,
        characteristicId,
      },
    })
  }

  async findAll(
    characteristicId: string,
    { cursor, query }: FindAllCharacteristicValueDto,
  ) {
    const limit = 10

    const where: Prisma.CharacteristicValueWhereInput = {
      OR: buildContainsArray({ fields: ['value'], query }),
      characteristicId,
    }

    const items = await this.db.characteristicValue.findMany({
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

  async findOne(characteristicId: string, id: string) {
    const value = await this.getValue(characteristicId, id)

    return value
  }

  async update(
    characteristicId: string,
    id: string,
    updateValueDto: UpdateValueDto,
  ) {
    await this.getValue(characteristicId, id)

    await this.db.characteristicValue.update({
      where: {
        characteristicId,
        id,
      },
      data: updateValueDto,
    })
  }

  async remove(characteristicId: string, id: string) {
    await this.getValue(characteristicId, id)
    const count = await this.getProductsCountForValue(id)

    if (count >= 1) {
      throw new BadRequestException(
        `Невозмножно удалить значение характеристики. К этой характеристике привязаны ${count} товаров.`,
      )
    }

    await this.db.characteristicValue.delete({
      where: {
        id,
      },
    })
  }
}
