import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CreateVariantAdditionalAttributeDto } from './dto/create-variant-additional-attribute.dto'
import { UpdateVariantAdditionalAttributeDto } from './dto/update-variant-additional-attribute.dto'
import { DbService } from '../../db/db.service'
import { FindAllVariantAdditionalAttributeDto } from './dto/findAll-variant-additional-attribute.dto'
import { Prisma } from '@prisma/client'
import { buildContainsArray } from '../common/utils/db-helpers'
import { DEFAULT_PRISMA_LIMIT } from '../common/constants'

@Injectable()
export class VariantAdditionalAttributesService {
  constructor(private db: DbService) {}

  private async getAttribute(id: string) {
    const attribute = await this.db.additionalAttribute.findUnique({
      where: {
        id,
      },
    })

    if (!attribute) {
      throw new NotFoundException('Дополнительный аттрибут варианта не найден.')
    }

    return attribute
  }

  private async checkIfNameIsTaken(name: string) {
    const attribute = await this.db.additionalAttribute.findUnique({
      where: {
        name,
      },
    })

    if (attribute) {
      throw new NotFoundException('Дополнительный аттрибут варианта не найден.')
    }
  }

  async create(
    createVariantAdditionalAttributeDto: CreateVariantAdditionalAttributeDto,
  ) {
    await this.checkIfNameIsTaken(createVariantAdditionalAttributeDto.name)

    return this.db.additionalAttribute.create({
      data: createVariantAdditionalAttributeDto,
    })
  }

  async findAll({ cursor, query }: FindAllVariantAdditionalAttributeDto) {
    const where: Prisma.AdditionalAttributeWhereInput = {
      OR: buildContainsArray({ fields: ['name'], query }),
    }

    const items = await this.db.additionalAttribute.findMany({
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
    return await this.getAttribute(id)
  }

  async update(
    id: string,
    updateVariantAdditionalAttributeDto: UpdateVariantAdditionalAttributeDto,
  ) {
    await this.getAttribute(id)

    if (updateVariantAdditionalAttributeDto.name) {
      await this.checkIfNameIsTaken(updateVariantAdditionalAttributeDto.name)
    }

    return await this.db.additionalAttribute.update({
      where: {
        id,
      },
      data: updateVariantAdditionalAttributeDto,
    })
  }

  async remove(id: string) {
    await this.getAttribute(id)

    const usedOccurencesCount = await this.db.variantAdditionalAttribute.count({
      where: {
        additionalAttributeId: id,
      },
    })

    if (usedOccurencesCount !== 0) {
      throw new BadRequestException(
        `Невозможно удалить аттрибут, так как он используеться в ${usedOccurencesCount} вариантах.`,
      )
    }

    return await this.db.additionalAttribute.delete({
      where: {
        id,
      },
    })
  }
}
