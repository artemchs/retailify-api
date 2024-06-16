import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common'
import { GoodsReceiptsService } from './goods-receipts.service'
import { CreateGoodsReceiptDto } from './dto/create-goods-receipt.dto'
import { UpdateGoodsReceiptDto } from './dto/update-goods-receipt.dto'
import { FindAllGoodsReceiptDto } from './dto/findAll-goods-receipt.dto'
import { Roles } from '../common/decorators'
import { Role } from '../common/enums'
import { AccessTokenGuard, RolesGuard } from '../common/guards'

@Controller('system/goods-receipts')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(Role.Admin)
export class GoodsReceiptsController {
  constructor(private readonly goodsReceiptsService: GoodsReceiptsService) {}

  @Post()
  create(@Body() createGoodsReceiptDto: CreateGoodsReceiptDto) {
    return this.goodsReceiptsService.create(createGoodsReceiptDto)
  }

  @Get()
  findAll(@Query() query: FindAllGoodsReceiptDto) {
    return this.goodsReceiptsService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.goodsReceiptsService.findOne(id)
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateGoodsReceiptDto: UpdateGoodsReceiptDto,
  ) {
    return this.goodsReceiptsService.update(id, updateGoodsReceiptDto)
  }

  @Delete(':id')
  archive(@Param('id') id: string) {
    return this.goodsReceiptsService.archive(id)
  }

  @Put('restore/:id')
  restore(@Param('id') id: string) {
    return this.goodsReceiptsService.restore(id)
  }
}
