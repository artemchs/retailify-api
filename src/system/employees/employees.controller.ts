import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { EmployeesService } from './employees.service'
import { CreateDto } from './dto'
import { Roles } from '../common/decorators'
import { Role } from '../common/enums'
import { FindAllDto } from './dto/findAll.dto'

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
}
