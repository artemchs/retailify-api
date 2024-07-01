import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { CreateProductImportDto } from './dto/create-product-import.dto'
import { FindAllProductImportsDto } from './dto/findAll-product-imports.dto'
import { AccessTokenGuard, RolesGuard } from '../common/guards'
import { Role } from '../common/enums'
import { Roles } from '../common/decorators'
import { ProductsImportService } from './products-import.service'

@Controller('system/import')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(Role.Admin)
export class ImportController {
  constructor(private readonly importProductsService: ProductsImportService) {}

  @Post('/products')
  createProductImport(@Body() body: CreateProductImportDto) {
    return this.importProductsService.createProductImport(body)
  }

  @Get('/products')
  findAllProductImports(@Query() query: FindAllProductImportsDto) {
    return this.importProductsService.findAllProductImports(query)
  }

  @Get('/products/:id')
  findOneProductImport(@Param('id') id: string) {
    return this.importProductsService.findOneProductImport(id)
  }

  @Get('/products/last')
  findLastPorductImport() {
    return this.importProductsService.findLastProductImport()
  }
}
