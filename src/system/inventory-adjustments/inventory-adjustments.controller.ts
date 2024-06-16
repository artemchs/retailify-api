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
import { InventoryAdjustmentsService } from './inventory-adjustments.service'
import { CreateInventoryAdjustmentDto } from './dto/create-inventory-adjustment.dto'
import { UpdateInventoryAdjustmentDto } from './dto/update-inventory-adjustment.dto'
import { FindAllInventoryAdjustmentDto } from './dto/findAll-inventory-adjustment.dto'
import { CreateInventoryAdjustmentReasonDto } from './dto/create-inventory-adjustment-reason.dto'
import { UpdateInventoryAdjustmentReasonDto } from './dto/update-inventory-adjustment-reason.dto'
import { Roles } from '../common/decorators'
import { Role } from '../common/enums'
import { AccessTokenGuard, RolesGuard } from '../common/guards'

@Controller('system/inventory-adjustments')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(Role.Admin)
export class InventoryAdjustmentsController {
  constructor(
    private readonly inventoryAdjustmentsService: InventoryAdjustmentsService,
  ) {}

  @Post('reasons')
  createReason(
    @Body() createInventoryAdjustmentReason: CreateInventoryAdjustmentReasonDto,
  ) {
    return this.inventoryAdjustmentsService.createReason(
      createInventoryAdjustmentReason,
    )
  }

  @Get('reasons')
  findAllReasons(@Query() query: { cursor?: string; query?: string }) {
    return this.inventoryAdjustmentsService.findAllReasons(query)
  }

  @Get('reasons/:id')
  findOneReason(@Param('id') id: string) {
    return this.inventoryAdjustmentsService.findOneReason(id)
  }

  @Put('reasons/:id')
  updateReason(
    @Param('id') id: string,
    @Body() updateInventoryAdjustmentReason: UpdateInventoryAdjustmentReasonDto,
  ) {
    return this.inventoryAdjustmentsService.updateReason(
      id,
      updateInventoryAdjustmentReason,
    )
  }

  @Delete('reasons/:id')
  removeReason(@Param('id') id: string) {
    return this.inventoryAdjustmentsService.removeReason(id)
  }

  @Post()
  create(@Body() createInventoryAdjustmentDto: CreateInventoryAdjustmentDto) {
    return this.inventoryAdjustmentsService.create(createInventoryAdjustmentDto)
  }

  @Get()
  findAll(@Query() query: FindAllInventoryAdjustmentDto) {
    return this.inventoryAdjustmentsService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inventoryAdjustmentsService.findOne(id)
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateInventoryAdjustmentDto: UpdateInventoryAdjustmentDto,
  ) {
    return this.inventoryAdjustmentsService.update(
      id,
      updateInventoryAdjustmentDto,
    )
  }

  @Delete(':id')
  archive(@Param('id') id: string) {
    return this.inventoryAdjustmentsService.archive(id)
  }

  @Put('restore/:id')
  restore(@Param('id') id: string) {
    return this.inventoryAdjustmentsService.restore(id)
  }
}
