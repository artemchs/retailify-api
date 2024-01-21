import { Injectable, NotFoundException } from '@nestjs/common'
import { CreateWarehouseDto } from './dto/create-warehouse.dto'
import { DbService } from '../../db/db.service'
import { FindAllWarehouseDto } from './dto/findAll-warehouse.dto'

import { Prisma } from '@prisma/client'
import { UpdateWarehouseDto } from './dto/update-warehouse.dto'
import {
  buildContainsArray,
  buildOrderByArray,
  calculateTotalPages,
  checkIsArchived,
  getPaginationData,
} from '../common/utils/db-helpers'

@Injectable()
export class WarehousesService {
  constructor(private db: DbService) {}

  private async getWarehouse(id: string) {
    const warehouse = await this.db.warehouse.findUnique({
      where: {
        id,
      },
    })

    if (!warehouse) {
      throw new NotFoundException('Склад не найден.')
    }

    return warehouse
  }

  async create(createWarehouseDto: CreateWarehouseDto) {
    await this.db.warehouse.create({
      data: createWarehouseDto,
    })
  }

  async findAll({
    page,
    rowsPerPage,
    isArchived,
    orderBy,
    query,
  }: FindAllWarehouseDto) {
    const { skip, take } = getPaginationData({ page, rowsPerPage })

    const where: Prisma.WarehouseWhereInput = {
      isArchived: checkIsArchived(isArchived),
      OR: buildContainsArray({
        fields: ['name', 'address'],
        query,
      }),
    }

    const [items, totalItems] = await Promise.all([
      this.db.warehouse.findMany({
        where,
        take,
        skip,
        orderBy: buildOrderByArray({ orderBy }),
      }),
      this.db.warehouse.count({
        where,
      }),
    ])

    return {
      items,
      info: {
        totalPages: calculateTotalPages(totalItems, take),
        totalItems,
      },
    }
  }

  async findOne(id: string) {
    const warehouse = await this.getWarehouse(id)

    return warehouse
  }

  async update(id: string, updateWarehouseDto: UpdateWarehouseDto) {
    await this.getWarehouse(id)

    await this.db.warehouse.update({
      where: {
        id,
      },
      data: updateWarehouseDto,
    })
  }

  async archive(id: string) {
    await this.getWarehouse(id)

    await this.db.warehouse.update({
      where: {
        id,
      },
      data: {
        isArchived: true,
      },
    })
  }

  async restore(id: string) {
    await this.getWarehouse(id)

    await this.db.warehouse.update({
      where: {
        id,
      },
      data: {
        isArchived: false,
      },
    })
  }
}