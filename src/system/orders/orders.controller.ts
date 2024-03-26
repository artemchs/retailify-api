import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common'
import { OrdersService } from './orders.service'
import { CreateOrderDto } from './dto/create-order.dto'
import {
  FindAllOrderDto,
  FindAllOrderInfiniteListDto,
} from './dto/findAll-order.dto'

@Controller('system/orders')
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
