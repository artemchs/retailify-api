import { Module } from '@nestjs/common'
import { VariantAdditionalAttributesService } from './variant-additional-attributes.service'
import { VariantAdditionalAttributesController } from './variant-additional-attributes.controller'

@Module({
  controllers: [VariantAdditionalAttributesController],
  providers: [VariantAdditionalAttributesService],
})
export class VariantAdditionalAttributesModule {}
