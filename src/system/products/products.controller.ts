import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Put,
  UseGuards,
} from '@nestjs/common'
import { ProductsService } from './products.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { FindAllProductDto } from './dto/findAll-product.dto'
import { Roles } from '../common/decorators'
import { Role } from '../common/enums'
import { FindAllInfiniteListProductDto } from './dto/findAllInfiniteList-product.dto'
import { BatchEditProductDto } from './dto/batch-edit-product.dto'
import { AccessTokenGuard } from '../common/guards'

@Roles(Role.Admin)
@UseGuards(AccessTokenGuard)
@Controller('system/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto)
  }

  @Get()
  findAll(@Query() query: FindAllProductDto) {
    return this.productsService.findAll(query)
  }

  @Get('generate-sku')
  generateSku() {
    return this.productsService.generateSku()
  }

  @Get('infinite-list')
  findAllInfiniteList(@Query() query: FindAllInfiniteListProductDto) {
    return this.productsService.findAllInfiniteList(query)
  }

  @Get(':productId')
  findOne(@Param('productId') id: string) {
    return this.productsService.findOne(id)
  }

  @Put()
  batchEdit(@Body() batchEditDto: BatchEditProductDto) {
    return this.productsService.batchEdit(batchEditDto)
  }

  @Put(':productId')
  update(
    @Param('productId') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto)
  }

  @Delete(':productId')
  archive(@Param('productId') id: string) {
    return this.productsService.archive(id)
  }

  @Put('restore/:productId')
  restore(@Param('productId') id: string) {
    return this.productsService.restore(id)
  }
}
