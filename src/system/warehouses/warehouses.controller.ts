import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import { Roles } from '../common/decorators'
import { Role } from '../common/enums'
import { WarehousesService } from './warehouses.service'
import { CreateWarehouseDto } from './dto/create-warehouse.dto'
import { FindAllWarehouseDto } from './dto/findAll-warehouse.dto'
import { UpdateWarehouseDto } from './dto/update-warehouse.dto'
import { FindAllInfiniteListWarehouseDto } from './dto/findAllInfiniteList-warehouse.dto'
import { AccessTokenGuard } from '../common/guards'

@Roles(Role.Admin)
@UseGuards(AccessTokenGuard)
@Controller('system/warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post()
  create(@Body() createWarehouseDto: CreateWarehouseDto) {
    return this.warehousesService.create(createWarehouseDto)
  }

  @Get()
  findAll(@Query() query: FindAllWarehouseDto) {
    return this.warehousesService.findAll(query)
  }

  @Get('get-all')
  getAll() {
    return this.warehousesService.getAll()
  }

  @Get('infinite-list')
  findAllInfiniteList(@Query() query: FindAllInfiniteListWarehouseDto) {
    return this.warehousesService.findAllInfiniteList(query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.warehousesService.findOne(id)
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateWarehouseDto: UpdateWarehouseDto,
  ) {
    return this.warehousesService.update(id, updateWarehouseDto)
  }

  @Delete(':id')
  archive(@Param('id') id: string) {
    return this.warehousesService.archive(id)
  }

  @Put('restore/:id')
  restore(@Param('id') id: string) {
    return this.warehousesService.restore(id)
  }
}
