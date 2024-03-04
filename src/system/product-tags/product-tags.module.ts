import { Module } from '@nestjs/common'
import { ProductTagsService } from './product-tags.service'
import { ProductTagsController } from './product-tags.controller'

@Module({
  controllers: [ProductTagsController],
  providers: [ProductTagsService],
})
export class ProductTagsModule {}
