import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CreateCustomOperationDto } from './dto/create-custom-operation.dto'
import { UpdateCustomOperationDto } from './dto/update-custom-operation.dto'
import { DbService } from '../../../db/db.service'
import { FindAllCustomOperationDto } from './dto/findAll-custom-operation.dto'
import { Prisma } from '@prisma/client'
import { buildContainsArray } from 'src/system/common/utils/db-helpers'

@Injectable()
export class CustomOperationsService {
  constructor(private db: DbService) {}

  private async getCustomOperation(id: string) {
    const customOperation = await this.db.customFinancialOperation.findUnique({
      where: {
        id,
      },
    })

    if (!customOperation) {
      throw new NotFoundException('Пользовательская операция не найдена.')
    }

    return customOperation
  }

  async create(createCustomOperationDto: CreateCustomOperationDto) {
    return await this.db.customFinancialOperation.create({
      data: createCustomOperationDto,
    })
  }

  async findAll({ cursor, query }: FindAllCustomOperationDto) {
    const limit = 10

    const where: Prisma.CustomFinancialOperationWhereInput = {
      OR: buildContainsArray({ fields: ['name'], query }),
    }

    const items = await this.db.customFinancialOperation.findMany({
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
    return await this.getCustomOperation(id)
  }

  async update(id: string, updateCustomOperationDto: UpdateCustomOperationDto) {
    await this.getCustomOperation(id)

    return await this.db.customFinancialOperation.update({
      where: {
        id,
      },
      data: updateCustomOperationDto,
    })
  }

  async remove(id: string) {
    await this.getCustomOperation(id)
    const transactionsCount = await this.db.transaction.count({
      where: {
        customOperationId: id,
      },
    })

    if (transactionsCount >= 1) {
      throw new BadRequestException(
        `Невозможно удалить операцию, так как она используеться в ${transactionsCount} транзакциях.`,
      )
    }

    await this.db.customFinancialOperation.delete({
      where: {
        id,
      },
    })
  }
}
