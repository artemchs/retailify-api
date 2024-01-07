import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common'
import { EmployeesService } from './employees.service'
import { CreateDto, FindAllDto, UpdateDto } from './dto'
import { Roles } from '../common/decorators'
import { Role } from '../common/enums'

@Roles(Role.Admin)
@Controller('system/employees')
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  @Get()
  findAll(@Query() query: FindAllDto) {
    return this.employeesService.findAll(query)
  }

  @Post()
  create(@Body() body: CreateDto) {
    return this.employeesService.create(body)
  }

  @Put(':id')
  update(@Body() body: UpdateDto, @Param('id') userId: string) {
    return this.employeesService.update(body, userId)
  }
}
