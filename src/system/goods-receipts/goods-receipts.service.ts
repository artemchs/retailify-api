import { Injectable, NotFoundException } from '@nestjs/common'
import { CreateGoodsReceiptDto } from './dto/create-goods-receipt.dto'
import { UpdateGoodsReceiptDto } from './dto/update-goods-receipt.dto'
import { DbService } from '../../db/db.service'
import { FindAllGoodsReceiptDto } from './dto/findAll-goods-receipt.dto'
import {
  buildContainsArray,
  buildOrderByArray,
  calculateTotalPages,
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
        productVariants: {
          include: {
            variant: true,
          },
        },
      },
    })

    if (!goodsReceipt) {
      throw new NotFoundException('Накладная прихода не найдена.')
    }

    return goodsReceipt
  }

  private async checkIfSupplierExists(id?: string) {
    if (id) {
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
  }

  private async checkIfWarehouseExists(id?: string) {
    if (id) {
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
  }

  async create(createGoodsReceiptDto: CreateGoodsReceiptDto) {
    const [goodsReceiptsCount] = await Promise.all([
      this.db.goodsReceipt.count(),
      this.checkIfSupplierExists(createGoodsReceiptDto.supplierId),
      this.checkIfWarehouseExists(createGoodsReceiptDto.warehouseId),
    ])

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

  async findAll({ page, rowsPerPage, orderBy, query }: FindAllGoodsReceiptDto) {
    const { skip, take } = getPaginationData({ page, rowsPerPage })

    const where: Prisma.GoodsReceiptWhereInput = {
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
    await Promise.all([
      this.getGoodsReceipt(id),
      this.checkIfSupplierExists(updateGoodsReceiptDto.supplierId),
      this.checkIfWarehouseExists(updateGoodsReceiptDto.warehouseId),
    ])

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
}
