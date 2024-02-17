import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Put,
} from '@nestjs/common'
import { VariantsService } from './variants.service'
import { CreateVariantDto } from './dto/create-variant.dto'
import { UpdateVariantDto } from './dto/update-variant.dto'
import { FindAllVariantDto } from './dto/findAll-variant.dto'
import { Roles } from '../../../system/common/decorators'
import { Role } from '../../../system/common/enums'
import { FindAllInfiniteListVariantDto } from './dto/findAllInfiniteList-variant.dto'

@Roles(Role.Admin)
@Controller('system/products/:productId/variants')
export class VariantsController {
  constructor(private readonly variantsService: VariantsService) {}

  @Post()
  create(
    @Param('productId') productId: string,
    @Body() createVariantDto: CreateVariantDto,
  ) {
    return this.variantsService.create(productId, createVariantDto)
  }

  @Get()
  findAll(@Query() query: FindAllVariantDto) {
    return this.variantsService.findAll(query)
  }

  @Get('infinite-list')
  findAllInfiniteList(
    @Param('productId') productId: string,
    @Query() query: FindAllInfiniteListVariantDto,
  ) {
    return this.variantsService.findAllInfiniteList(productId, query)
  }

  @Get(':variantId')
  findOne(@Param('variantId') id: string) {
    return this.variantsService.findOne(id)
  }

  @Put(':variantId')
  update(
    @Param('productId') productId: string,
    @Param('variantId') id: string,
    @Body() updateVariantDto: UpdateVariantDto,
  ) {
    return this.variantsService.update(productId, id, updateVariantDto)
  }

  @Delete(':variantId')
  archive(@Param('variantId') id: string) {
    return this.variantsService.archive(id)
  }

  @Put('restore/:variantId')
  restore(@Param('variantId') id: string) {
    return this.variantsService.restore(id)
  }
}
