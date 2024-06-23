import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ImportService } from './import.service'
import { CreateImportDto } from './dto/create-import.dto'
import { FindAllImportDto } from './dto/findAll-import.dto'

@Controller('system/import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('/products')
  createProductImport(@Body() body: CreateImportDto) {
    return this.importService.createProductImport(body)
  }

  @Get('/products')
  findAllProductImports(@Query() query: FindAllImportDto) {
    return this.importService.findAllProductImports(query)
  }

  @Get('/products/:id')
  findOneProductImport(@Param('id') id: string) {
    return this.importService.findOneProductImport(id)
  }

  @Get('/products/last')
  findLastPorductImport() {
    return this.importService.findLastProductImport()
  }
}
