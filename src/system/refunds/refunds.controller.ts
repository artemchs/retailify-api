import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common'
import { RefundsService } from './refunds.service'
import { CreateRefundDto } from './dto/create-refund.dto'
import {
  FindAllRefundDto,
  FindAllRefundInfiniteListDto,
} from './dto/findAll-refund.dto'
import { GetCurrentUserAccessToken } from '../common/decorators'

@Controller('system/refunds')
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Post()
  create(
    @Body() createRefundDto: CreateRefundDto,
    @GetCurrentUserAccessToken('sub') userId: string,
    @Query('shiftId') shiftId?: string,
  ) {
    return this.refundsService.create(createRefundDto, userId, shiftId)
  }

  @Get()
  findAll(@Query() query: FindAllRefundDto) {
    return this.refundsService.findAll(query)
  }

  @Get('infinite-list')
  findAllInfiniteList(@Query() query: FindAllRefundInfiniteListDto) {
    return this.refundsService.findAllInfiniteList(query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.refundsService.findOne(id)
  }
}
