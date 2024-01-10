import { Injectable, NotFoundException } from '@nestjs/common'
import { CreateSupplierDto } from './dto/create-supplier.dto'
import { UpdateSupplierDto } from './dto/update-supplier.dto'
import { DbService } from '../../db/db.service'
import { FindAllSupplierDto } from './dto/findAll-supplier.dto'
import { Prisma } from '@prisma/client'
import { calculateTotalPages } from '../common/utils/calculate-total-pages'

@Injectable()
export class SuppliersService {
  constructor(private db: DbService) {}

  private async getSupplier(id: string) {
    const supplier = await this.db.supplier.findUnique({
      where: {
        id,
      },
    })

    if (!supplier) {
      throw new NotFoundException('Поставщик не найден.')
    }

    return supplier
  }

  async create(createSupplierDto: CreateSupplierDto) {
    await this.db.supplier.create({
      data: {
        ...createSupplierDto,
      },
    })
  }

  async findAll({ page, rowsPerPage, orderBy, query }: FindAllSupplierDto) {
    const take = Number(rowsPerPage ?? 10)
    const currentPage = Number(page ?? 1)
    const skip = (currentPage - 1) * take

    const where: Prisma.SupplierWhereInput = {
      OR: query
        ? [
            {
              name: {
                contains: query,
              },
            },
            {
              contactPerson: {
                contains: query,
              },
            },
            {
              email: {
                contains: query,
              },
            },
            {
              phone: {
                contains: query,
              },
            },
            {
              address: {
                contains: query,
              },
            },
          ]
        : undefined,
    }

    const [items, totalItems] = await Promise.all([
      this.db.supplier.findMany({
        where,
        take,
        skip,
        orderBy: orderBy
          ? [
              {
                name: orderBy.name ? orderBy.name : undefined,
              },
              {
                contactPerson: orderBy.contactPerson ? orderBy.name : undefined,
              },
              {
                phone: orderBy.phone ? orderBy.name : undefined,
              },
              {
                address: orderBy.address ? orderBy.name : undefined,
              },
              {
                email: orderBy.email ? orderBy.email : undefined,
              },
            ]
          : {
              createdAt: 'desc',
            },
      }),
      this.db.supplier.count({
        where,
      }),
    ])

    const totalPages = calculateTotalPages(totalItems, take)

    return {
      items,
      info: {
        totalPages,
        totalItems,
      },
    }
  }

  async findOne(id: string) {
    const supplier = await this.getSupplier(id)

    return supplier
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto) {
    await this.getSupplier(id)

    await this.db.supplier.update({
      where: {
        id,
      },
      data: {
        ...updateSupplierDto,
      },
    })
  }

  async remove(id: string) {
    await this.getSupplier(id)

    await this.db.supplier.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
      },
    })
  }
}
