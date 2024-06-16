import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ShiftsService } from './shifts.service'
import { CreateShiftDto } from './dto/create-shift.dto'
import {
  GetCurrentUserAccessToken,
  Roles,
} from '../../../system/common/decorators'
import { FindAllShiftDto } from './dto/findAll-shifts.dto'
import { UpdateShiftDto } from './dto/update-shift.dto'
import { CashRegisterTransactionDto } from './dto/cash-register-transaction.dto'
import { Cron, CronExpression } from '@nestjs/schedule'
import { AccessTokenGuard, RolesGuard } from 'src/system/common/guards'
import { Role } from 'src/system/common/enums'

@Controller('system/points-of-sale/:posId/shifts')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(Role.Admin)
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

  @Put(':id/close')
  close(
    @Param('id') id: string,
    @GetCurrentUserAccessToken('sub') userId: string,
  ) {
    return this.shiftsService.close(id, userId)
  }

  @Cron(CronExpression.EVERY_DAY_AT_11PM, {
    timeZone: 'Europe/Kyiv',
  })
  closeAllShifts() {
    return this.shiftsService.closeAllShifts()
  }

  @Post(':id/deposit')
  deposit(
    @Body() depositDto: CashRegisterTransactionDto,
    @Param('id') id: string,
    @GetCurrentUserAccessToken('sub') userId: string,
  ) {
    return this.shiftsService.deposit(id, userId, depositDto)
  }

  @Post(':id/withdrawal')
  withdrawal(
    @Body() withdrawalDto: CashRegisterTransactionDto,
    @Param('id') id: string,
    @GetCurrentUserAccessToken('sub') userId: string,
  ) {
    return this.shiftsService.withdrawal(id, userId, withdrawalDto)
  }
}
