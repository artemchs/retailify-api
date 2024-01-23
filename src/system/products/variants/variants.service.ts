import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CreateVariantDto } from './dto/create-variant.dto'
import { UpdateVariantDto } from './dto/update-variant.dto'
import { DbService } from '../../../db/db.service'
import { FindAllVariantDto } from './dto/findAll-variant.dto'
import {
  buildContainsArray,
  buildOrderByArray,
  calculateTotalPages,
  checkIsArchived,
  getPaginationData,
} from '../../common/utils/db-helpers'
import { Prisma } from '@prisma/client'

@Injectable()
export class VariantsService {
  constructor(private db: DbService) {}

  private async getVariant(id: string) {
    const variant = await this.db.variant.findUnique({
      where: {
        id,
      },
    })

    if (!variant) {
      throw new NotFoundException('Вариант не найден.')
    }

    return variant
  }

  async create(productId: string, createVariantDto: CreateVariantDto) {
    const variantWithTheSameSku = await this.db.variant.findUnique({
      where: {
        sku: createVariantDto.sku,
      },
    })

    if (variantWithTheSameSku) {
      throw new BadRequestException(
        `Артикул ${variantWithTheSameSku.sku} уже занят.`,
      )
    }

    await this.db.variant.create({
      data: {
        ...createVariantDto,
        totalReceivedQuantity: 0,
        totalWarehouseQuantity: 0,
        productId,
      },
    })
  }

  async findAll({
    page,
    rowsPerPage,
    isArchived,
    orderBy,
    query,
    productIds,
  }: FindAllVariantDto) {
    const { skip, take } = getPaginationData({ page, rowsPerPage })

    const where: Prisma.VariantWhereInput = {
      isArchived: checkIsArchived(isArchived),
      OR: buildContainsArray({ fields: ['sku', 'barcode'], query }),
      productId:
        productIds && productIds.length >= 1
          ? {
              in: productIds,
            }
          : undefined,
    }

    const [items, totalItems] = await Promise.all([
      this.db.variant.findMany({
        where,
        take,
        skip,
        orderBy: buildOrderByArray({ orderBy }),
      }),
      this.db.variant.count({
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
    const variant = await this.getVariant(id)

    return variant
  }

  async update(
    productId: string,
    id: string,
    updateVariantDto: UpdateVariantDto,
  ) {
    await this.getVariant(id)

    await this.db.variant.update({
      where: {
        id,
      },
      data: {
        ...updateVariantDto,
        productId,
      },
    })
  }

  async archive(id: string) {
    await this.getVariant(id)

    await this.db.variant.update({
      where: {
        id,
      },
      data: {
        isArchived: true,
      },
    })
  }

  async restore(id: string) {
    await this.getVariant(id)

    await this.db.variant.update({
      where: {
        id,
      },
      data: {
        isArchived: false,
      },
    })
  }
}
