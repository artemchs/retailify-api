import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common'
import { OrdersService } from './orders.service'
import { CreateOrderDto } from './dto/create-order.dto'
import {
  FindAllOrderDto,
  FindAllOrderInfiniteListDto,
} from './dto/findAll-order.dto'
import { AccessTokenGuard, RolesGuard } from '../common/guards'
import { Roles } from '../common/decorators'
import { Role } from '../common/enums'

@Controller('system/orders')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(Role.Admin)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @Body() createOrderDto: CreateOrderDto,
    @Query('shiftId') shiftId: string,
  ) {
    return this.ordersService.create(createOrderDto, shiftId)
  }

  @Get()
  findAll(@Query() query: FindAllOrderDto) {
    return this.ordersService.findAll(query)
  }

  @Get('infinite-list')
  findAllInfiniteList(@Query() query: FindAllOrderInfiniteListDto) {
    return this.ordersService.findAllInfiniteList(query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id)
  }
}
