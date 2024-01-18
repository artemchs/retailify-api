import { Injectable, NotFoundException } from '@nestjs/common'
import { CreateGoodsReceiptDto } from './dto/create-goods-receipt.dto'
import { UpdateGoodsReceiptDto } from './dto/update-goods-receipt.dto'
import { DbService } from '../../db/db.service'
import { FindAllGoodsReceiptDto } from './dto/findAll-goods-receipt.dto'
import {
  buildContainsArray,
  buildOrderByArray,
  calculateTotalPages,
  checkIsArchived,
  getPaginationData,
} from '../common/utils/db-helpers'
import { Prisma } from '@prisma/client'

@Injectable()
export class GoodsReceiptsService {
  constructor(private db: DbService) {}

  private async getGoodsReceipt(id: string) {
    const goodsReceipt = await this.db.goodsReceipt.findUnique({
      where: {
        id,
      },
      include: {
        supplierInvoice: true,
      },
    })

    if (!goodsReceipt) {
      throw new NotFoundException('Накладная прихода не найдена.')
    }

    return goodsReceipt
  }

  private async checkIfSupplierExists(id: string) {
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

  async create(createGoodsReceiptDto: CreateGoodsReceiptDto) {
    await this.checkIfSupplierExists(createGoodsReceiptDto.supplierId)

    const goodsReceiptsCount = await this.db.goodsReceipt.count()

    await this.db.goodsReceipt.create({
      data: {
        name: `Приход #${goodsReceiptsCount + 1}`,
        supplierId: createGoodsReceiptDto.supplierId,
        goodsReceiptDate: createGoodsReceiptDto.goodsReceiptDate,
        supplierInvoice: {
          create: {
            paymentOption: createGoodsReceiptDto.paymentOption,
            paymentTerm: createGoodsReceiptDto.paymentTerm,
            accountsPayable: 0,
          },
        },
      },
    })
  }

  async findAll({
    page,
    rowsPerPage,
    isArchived,
    orderBy,
    query,
  }: FindAllGoodsReceiptDto) {
    const { skip, take } = getPaginationData({ page, rowsPerPage })

    const where: Prisma.GoodsReceiptWhereInput = {
      isArchived: checkIsArchived(isArchived),
      OR: buildContainsArray({ fields: ['name'], query }),
    }

    const [items, totalItems] = await Promise.all([
      this.db.goodsReceipt.findMany({
        where,
        take,
        skip,
        orderBy: buildOrderByArray({ orderBy }),
      }),
      this.db.goodsReceipt.count({
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
    const goodsReceipt = await this.getGoodsReceipt(id)

    return goodsReceipt
  }

  async update(id: string, updateGoodsReceiptDto: UpdateGoodsReceiptDto) {
    await this.getGoodsReceipt(id)

    if (updateGoodsReceiptDto.supplierId) {
      await this.checkIfSupplierExists(updateGoodsReceiptDto.supplierId)
    }

    await this.db.goodsReceipt.update({
      where: {
        id,
      },
      data: {
        supplierId: updateGoodsReceiptDto.supplierId,
        goodsReceiptDate: updateGoodsReceiptDto.goodsReceiptDate,
        supplierInvoice: {
          update: {
            paymentOption: updateGoodsReceiptDto.paymentOption,
            paymentTerm: updateGoodsReceiptDto.paymentTerm,
          },
        },
      },
    })
  }

  async archive(id: string) {
    await this.getGoodsReceipt(id)

    await this.db.goodsReceipt.update({
      where: {
        id,
      },
      data: {
        isArchived: true,
      },
    })
  }

  async restore(id: string) {
    await this.getGoodsReceipt(id)

    await this.db.goodsReceipt.update({
      where: {
        id,
      },
      data: {
        isArchived: false,
      },
    })
  }
}
