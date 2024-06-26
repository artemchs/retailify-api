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
import { SuppliersService } from './suppliers.service'
import { CreateSupplierDto } from './dto/create-supplier.dto'
import { UpdateSupplierDto } from './dto/update-supplier.dto'
import { FindAllSupplierDto } from './dto/findAll-supplier.dto'
import { Roles } from '../common/decorators'
import { Role } from '../common/enums'
import { FindAllInfiniteListSupplierDto } from './dto/findAllInfiniteList-supplier.dto'
import { AccessTokenGuard, RolesGuard } from '../common/guards'

@Controller('system/suppliers')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(Role.Admin)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Roles(Role.Admin)
  @Post()
  create(@Body() createSupplierDto: CreateSupplierDto) {
    return this.suppliersService.create(createSupplierDto)
  }

  @Get()
  findAll(@Query() query: FindAllSupplierDto) {
    return this.suppliersService.findAll(query)
  }

  @Get('infinite-list')
  findAllInfiniteList(@Query() query: FindAllInfiniteListSupplierDto) {
    return this.suppliersService.findAllInfiniteList(query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id)
  }

  @Roles(Role.Admin)
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(id, updateSupplierDto)
  }

  @Roles(Role.Admin)
  @Delete(':id')
  archive(@Param('id') id: string) {
    return this.suppliersService.archive(id)
  }

  @Roles(Role.Admin)
  @Put('restore/:id')
  restore(@Param('id') id: string) {
    return this.suppliersService.restore(id)
  }
}
