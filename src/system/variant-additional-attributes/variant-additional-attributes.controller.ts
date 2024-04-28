import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
} from '@nestjs/common'
import { VariantAdditionalAttributesService } from './variant-additional-attributes.service'
import { CreateVariantAdditionalAttributeDto } from './dto/create-variant-additional-attribute.dto'
import { UpdateVariantAdditionalAttributeDto } from './dto/update-variant-additional-attribute.dto'
import { Roles } from '../common/decorators'
import { Role } from '../common/enums'
import { FindAllVariantAdditionalAttributeDto } from './dto/findAll-variant-additional-attribute.dto'

@Roles(Role.Admin)
@Controller('system/variant-additional-attributes')
export class VariantAdditionalAttributesController {
  constructor(
    private readonly variantAdditionalAttributesService: VariantAdditionalAttributesService,
  ) {}

  @Post()
  create(
    @Body()
    createVariantAdditionalAttributeDto: CreateVariantAdditionalAttributeDto,
  ) {
    return this.variantAdditionalAttributesService.create(
      createVariantAdditionalAttributeDto,
    )
  }

  @Get()
  findAll(@Query() query: FindAllVariantAdditionalAttributeDto) {
    return this.variantAdditionalAttributesService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.variantAdditionalAttributesService.findOne(id)
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body()
    updateVariantAdditionalAttributeDto: UpdateVariantAdditionalAttributeDto,
  ) {
    return this.variantAdditionalAttributesService.update(
      id,
      updateVariantAdditionalAttributeDto,
    )
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.variantAdditionalAttributesService.remove(id)
  }
}
