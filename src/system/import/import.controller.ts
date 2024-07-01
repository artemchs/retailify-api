import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ImportService } from './import.service'
import { CreateImportDto } from './dto/create-import.dto'
import { FindAllImportDto } from './dto/findAll-import.dto'
import { AccessTokenGuard, RolesGuard } from '../common/guards'
import { Role } from '../common/enums'
import { Roles } from '../common/decorators'

@Controller('system/import')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(Role.Admin)
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
