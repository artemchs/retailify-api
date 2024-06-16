import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import { CustomOperationsService } from './custom-operations.service'
import { CreateCustomOperationDto } from './dto/create-custom-operation.dto'
import { UpdateCustomOperationDto } from './dto/update-custom-operation.dto'
import { FindAllCustomOperationDto } from './dto/findAll-custom-operation.dto'
import { AccessTokenGuard, RolesGuard } from '../common/guards'
import { Roles } from '../common/decorators'
import { Role } from '../common/enums'

@UseGuards(AccessTokenGuard)
@UseGuards(RolesGuard)
@Roles(Role.Admin)
@Controller('system/custom-operations')
export class CustomOperationsController {
  constructor(
    private readonly customOperationsService: CustomOperationsService,
  ) {}

  @Post()
  create(@Body() createCustomOperationDto: CreateCustomOperationDto) {
    return this.customOperationsService.create(createCustomOperationDto)
  }

  @Get()
  findAll(@Query() query: FindAllCustomOperationDto) {
    return this.customOperationsService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customOperationsService.findOne(id)
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateCustomOperationDto: UpdateCustomOperationDto,
  ) {
    return this.customOperationsService.update(id, updateCustomOperationDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customOperationsService.remove(id)
  }
}
