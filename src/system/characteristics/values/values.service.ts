import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CreateValueDto } from './dto/create-value.dto'
import { UpdateValueDto } from './dto/update-value.dto'
import { DbService } from '../../../db/db.service'

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
        characteristics: {
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

  async findAll(characteristicId: string) {
    const values = await this.db.characteristicValue.findMany({
      where: {
        characteristicId,
      },
      orderBy: {
        value: 'asc',
      },
    })

    return values
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
