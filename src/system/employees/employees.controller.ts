import { Body, Controller, Post } from '@nestjs/common'
import { EmployeesService } from './employees.service'
import { CreateDto } from './dto'
import { Roles } from '../common/decorators'
import { Role } from '../common/enums'

@Roles(Role.Admin)
@Controller('system/employees')
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  @Post('/')
  create(@Body() body: CreateDto) {
    return this.employeesService.create(body)
  }
}
