import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class DbService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.getOrThrow<string>('DATABASE_URL'),
        },
      },
    })
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }

  async reset() {
    const environment = this.configService.get<string>('NODE_ENV')

    if (environment === 'test') {
      return this.$transaction([
        this.productToColor.deleteMany(), // this one has to be deleted before colors and products

        this.systemUser.deleteMany(),
        this.allowedSystemUserEmail.deleteMany(),
        this.supplier.deleteMany(),
        this.warehouse.deleteMany(),
        this.variantToWarehouse.deleteMany(),
        this.goodsReceipt.deleteMany(),
        this.variantToGoodsReceipt.deleteMany(),
        this.supplierInvoice.deleteMany(),
        this.product.deleteMany(),
        this.productMedia.deleteMany(),
        this.variant.deleteMany(),
        this.color.deleteMany(),
        this.characteristic.deleteMany(),
        this.characteristicValue.deleteMany(),
        this.brand.deleteMany(),
        this.categoryGroup.deleteMany(),
        this.category.deleteMany(),
        this.inventoryAdjustment.deleteMany(),
        this.inventoryAdjustmentToVariant.deleteMany(),
        this.inventoryAdjustmentReason.deleteMany(),
        this.inventoryTransferItem.deleteMany(),
        this.inventoryTransferReason.deleteMany(),
        this.inventoryTransfer.deleteMany(),
        this.productTag.deleteMany(),
        this.pointOfSale.deleteMany(),
        this.transaction.deleteMany(),
        this.customer.deleteMany(),
        this.order.deleteMany(),
        this.cashierShift.deleteMany(),
        this.customerOrderItem.deleteMany(),
        this.orderInvoice.deleteMany(),
        this.transaction.deleteMany(),
        this.refund.deleteMany(),
        this.refundItem.deleteMany(),
        this.additionalAttribute.deleteMany(),
        this.variantAdditionalAttribute.deleteMany(),
        this.soleProprietorInfo.deleteMany(),
        this.soleProprietorCurrentAccount.deleteMany(),
        this.customFinancialOperation.deleteMany(),
      ])
    }
  }
}
