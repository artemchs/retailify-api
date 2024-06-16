import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Query,
  Delete,
  UseGuards,
} from '@nestjs/common'
import { InventoryTransfersService } from './inventory-transfers.service'
import { CreateInventoryTransferDto } from './dto/create-inventory-transfer.dto'
import { UpdateInventoryTransferDto } from './dto/update-inventory-transfer.dto'
import { Roles } from '../common/decorators'
import { Role } from '../common/enums'
import { FindAllInventoryTransferDto } from './dto/findAll-inventory-transfer.dto'
import { CreateInventoryTransferReasonDto } from './dto/create-inventory-transfer-reason.dto'
import { UpdateInventoryTransferReasonDto } from './dto/update-inventory-transfer-reason.dto'
import { AccessTokenGuard, RolesGuard } from '../common/guards'

@Controller('system/inventory-transfers')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(Role.Admin)
export class InventoryTransfersController {
  constructor(
    private readonly inventoryTransfersService: InventoryTransfersService,
  ) {}

  @Post('reasons')
  createReason(
    @Body() createInventoryTransferReasonDto: CreateInventoryTransferReasonDto,
  ) {
    return this.inventoryTransfersService.createReason(
      createInventoryTransferReasonDto,
    )
  }

  @Get('reasons')
  findAllReasons(@Query() query: { cursor?: string; query?: string }) {
    return this.inventoryTransfersService.findAllReasons(query)
  }

  @Get('reasons/:id')
  findOneReason(@Param('id') id: string) {
    return this.inventoryTransfersService.findOneReason(id)
  }

  @Put('reasons/:id')
  updateReason(
    @Param('id') id: string,
    @Body() updateInventoryTransferReason: UpdateInventoryTransferReasonDto,
  ) {
    return this.inventoryTransfersService.updateReason(
      id,
      updateInventoryTransferReason,
    )
  }

  @Delete('reasons/:id')
  removeReason(@Param('id') id: string) {
    return this.inventoryTransfersService.removeReason(id)
  }

  @Post()
  create(@Body() createInventoryTransferDto: CreateInventoryTransferDto) {
    return this.inventoryTransfersService.create(createInventoryTransferDto)
  }

  @Get()
  findAll(@Query() query: FindAllInventoryTransferDto) {
    return this.inventoryTransfersService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inventoryTransfersService.findOne(id)
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateInventoryTransferDto: UpdateInventoryTransferDto,
  ) {
    return this.inventoryTransfersService.update(id, updateInventoryTransferDto)
  }

  @Delete(':id')
  archive(@Param('id') id: string) {
    return this.inventoryTransfersService.archive(id)
  }

  @Put('restore/:id')
  restore(@Param('id') id: string) {
    return this.inventoryTransfersService.restore(id)
  }
}
