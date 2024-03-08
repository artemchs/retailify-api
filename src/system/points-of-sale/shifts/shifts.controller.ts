import { Controller, Get, Post, Body, Param, Put, Query } from '@nestjs/common'
import { ShiftsService } from './shifts.service'
import { CreateShiftDto } from './dto/create-shift.dto'
import { GetCurrentUserAccessToken } from '../../../system/common/decorators'
import { FindAllShiftDto } from './dto/findAll-shifts.dto'
import { UpdateShiftDto } from './dto/update-shift.dto'

@Controller('system/points-of-sale/:posId/shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post()
  create(
    @Body() createShiftDto: CreateShiftDto,
    @Param('posId') posId: string,
    @GetCurrentUserAccessToken('sub') userId: string,
  ) {
    return this.shiftsService.create(userId, posId, createShiftDto)
  }

  @Get()
  findAll(@Query() query: FindAllShiftDto, @Param('posId') posId: string) {
    return this.shiftsService.findAll(posId, query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shiftsService.findOne(id)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateShiftDto: UpdateShiftDto) {
    return this.shiftsService.update(id, updateShiftDto)
  }

  @Put(':id')
  close(
    @Param('id') id: string,
    @GetCurrentUserAccessToken('sub') userId: string,
  ) {
    return this.shiftsService.close(id, userId)
  }
}
