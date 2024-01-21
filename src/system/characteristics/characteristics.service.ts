import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CreateCharacteristicDto } from './dto/create-characteristic.dto'
import { UpdateCharacteristicDto } from './dto/update-characteristic.dto'
import { DbService } from '../../db/db.service'

@Injectable()
export class CharacteristicsService {
  constructor(private db: DbService) {}

  private async getCharacteristic(id: string) {
    const characteristic = await this.db.characteristic.findUnique({
      where: {
        id,
      },
    })

    if (!characteristic) {
      throw new NotFoundException('Характеристика не найдена.')
    }

    return characteristic
  }

  private async getCountOfProductsWithCharacteristic(id: string) {
    const count = await this.db.product.count({
      where: {
        characteristics: {
          some: {
            characteristicId: id,
          },
        },
      },
    })

    return count
  }

  async create(createCharacteristicDto: CreateCharacteristicDto) {
    await this.db.characteristic.create({
      data: createCharacteristicDto,
    })
  }

  async findAll() {
    const characteristics = await this.db.characteristic.findMany({
      orderBy: {
        name: 'asc',
      },
    })

    return characteristics
  }

  async findOne(id: string) {
    const characteristic = await this.getCharacteristic(id)

    return characteristic
  }

  async update(id: string, updateCharacteristicDto: UpdateCharacteristicDto) {
    await this.getCharacteristic(id)

    await this.db.characteristic.update({
      where: {
        id,
      },
      data: updateCharacteristicDto,
    })
  }

  async remove(id: string) {
    await this.getCharacteristic(id)
    const count = await this.getCountOfProductsWithCharacteristic(id)

    if (count >= 1) {
      throw new BadRequestException(
        `Невозможно удалить характеристику. Эта характеристика используеться в ${count} товарах.`,
      )
    }

    await this.db.characteristic.delete({
      where: {
        id,
      },
    })
  }
}
