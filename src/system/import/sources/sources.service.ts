import { Injectable, NotFoundException } from '@nestjs/common'
import { CreateSourceDto } from './dto/create-source.dto'
import { UpdateSourceDto } from './dto/update-source.dto'
import { DbService } from '../../../db/db.service'
import { FindAllSourceDto } from './dto/findAll-source.dto'
import { Prisma } from '@prisma/client'
import { buildContainsArray } from 'src/system/common/utils/db-helpers'
import { DEFAULT_PRISMA_LIMIT } from 'src/system/common/constants'

@Injectable()
export class SourcesService {
  constructor(private db: DbService) {}

  private async getImportSource(id: string) {
    const importSource = await this.db.importSource.findUnique({
      where: {
        id,
      },
    })

    if (!importSource)
      throw new NotFoundException('Этот источник импорта не найден.')

    return importSource
  }

  create({ name, schema }: CreateSourceDto) {
    return this.db.importSource.create({
      data: {
        name,
        schema: JSON.stringify(schema),
      },
    })
  }

  async findAll({ cursor, query }: FindAllSourceDto) {
    const where: Prisma.ImportSourceWhereInput = {
      OR: buildContainsArray({ fields: ['name'], query }),
    }

    const items = await this.db.importSource.findMany({
      take: DEFAULT_PRISMA_LIMIT + 1,
      where,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        name: true,
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

  findOne(id: string) {
    return this.getImportSource(id)
  }

  async update(id: string, { name, schema }: UpdateSourceDto) {
    await this.getImportSource(id)

    return this.db.importSource.update({
      where: {
        id,
      },
      data: {
        name,
        schema: schema ? JSON.stringify(schema) : undefined,
      },
    })
  }

  async remove(id: string) {
    await this.getImportSource(id)

    return this.db.importSource.delete({
      where: {
        id,
      },
    })
  }
}
