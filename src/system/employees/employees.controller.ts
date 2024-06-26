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
import { EmployeesService } from './employees.service'
import { CreateDto, FindAllDto, UpdateDto } from './dto'
import { Roles } from '../common/decorators'
import { Role } from '../common/enums'
import { AccessTokenGuard, RolesGuard } from '../common/guards'

@Controller('system/employees')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(Role.Admin)
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  @Get()
  findAll(@Query() query: FindAllDto) {
    return this.employeesService.findAll(query)
  }

  @Get('infinite-list')
  findAllInfiniteList(@Query() query: { query?: string; cursor?: string }) {
    return this.employeesService.findAllInfiniteList(query)
  }

  @Post()
  create(@Body() body: CreateDto) {
    return this.employeesService.create(body)
  }

  @Get(':id')
  findOne(@Param('id') userId: string) {
    return this.employeesService.findOne(userId)
  }

  @Put(':id')
  update(@Body() body: UpdateDto, @Param('id') userId: string) {
    return this.employeesService.update(body, userId)
  }

  @Delete(':id')
  remove(@Param('id') userId: string) {
    return this.employeesService.remove(userId)
  }
}
