import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Put,
  UseGuards,
} from '@nestjs/common'
import { CustomersService } from './customers.service'
import { CreateCustomerDto } from './dto/create-customer.dto'
import { UpdateCustomerDto } from './dto/update-customer.dto'
import { FindAllCustomerDto } from './dto/findAll-customer.dto'
import { AccessTokenGuard, RolesGuard } from '../common/guards'
import { Roles } from '../common/decorators'
import { Role } from '../common/enums'

@Controller('system/customers')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(Role.Admin)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto)
  }

  @Get()
  findAll(@Query() query: FindAllCustomerDto) {
    return this.customersService.findAll(query)
  }

  @Get('infinite-list')
  findAllInfiniteList(@Query() query: { cursor?: string; query?: string }) {
    return this.customersService.findAllInfiniteList(query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id)
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, updateCustomerDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customersService.remove(id)
  }
}
