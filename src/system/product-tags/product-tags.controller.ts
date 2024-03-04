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
import { ProductTagsService } from './product-tags.service'
import { CreateProductTagDto } from './dto/create-product-tag.dto'
import { UpdateProductTagDto } from './dto/update-product-tag.dto'
import { Roles } from '../common/decorators'
import { Role } from '../common/enums'
import { FindAllProductTagDto } from './dto/findAll-product-tag.dto'

@Roles(Role.Admin)
@Controller('system/product-tags')
export class ProductTagsController {
  constructor(private readonly productTagsService: ProductTagsService) {}

  @Post()
  create(@Body() createProductTagDto: CreateProductTagDto) {
    return this.productTagsService.create(createProductTagDto)
  }

  @Get()
  findAll(@Query() query: FindAllProductTagDto) {
    return this.productTagsService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productTagsService.findOne(id)
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductTagDto: UpdateProductTagDto,
  ) {
    return this.productTagsService.update(id, updateProductTagDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productTagsService.remove(id)
  }
}
