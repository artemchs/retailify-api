import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import { PointsOfSaleService } from './points-of-sale.service'
import { CreatePointsOfSaleDto } from './dto/create-points-of-sale.dto'
import { UpdatePointsOfSaleDto } from './dto/update-points-of-sale.dto'
import { FindAllPointsOfSaleDto } from './dto/findAll-points-of-sale.dto'
import { Roles } from '../common/decorators'
import { Role } from '../common/enums'
import { AccessTokenGuard, RolesGuard } from '../common/guards'

@Controller('system/points-of-sale')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(Role.Admin)
export class PointsOfSaleController {
  constructor(private readonly pointsOfSaleService: PointsOfSaleService) {}

  @Post()
  create(@Body() createPointsOfSaleDto: CreatePointsOfSaleDto) {
    return this.pointsOfSaleService.create(createPointsOfSaleDto)
  }

  @Get()
  findAll(@Query() query: FindAllPointsOfSaleDto) {
    return this.pointsOfSaleService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pointsOfSaleService.findOne(id)
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updatePointsOfSaleDto: UpdatePointsOfSaleDto,
  ) {
    return this.pointsOfSaleService.update(id, updatePointsOfSaleDto)
  }

  @Delete(':id')
  archive(@Param('id') id: string) {
    return this.pointsOfSaleService.archive(id)
  }

  @Put('restore/:id')
  restore(@Param('id') id: string) {
    return this.pointsOfSaleService.restore(id)
  }
}
