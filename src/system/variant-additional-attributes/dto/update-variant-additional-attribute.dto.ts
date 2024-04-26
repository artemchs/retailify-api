import { PartialType } from '@nestjs/mapped-types'
import { CreateVariantAdditionalAttributeDto } from './create-variant-additional-attribute.dto'

export class UpdateVariantAdditionalAttributeDto extends PartialType(
  CreateVariantAdditionalAttributeDto,
) {}
