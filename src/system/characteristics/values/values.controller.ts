import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  Logger,
} from '@nestjs/common'
import { ValuesService } from './values.service'
import { CreateValueDto } from './dto/create-value.dto'
import { UpdateValueDto } from './dto/update-value.dto'
import { Roles } from '../../../system/common/decorators'
import { Role } from '../../../system/common/enums'
import { FindAllCharacteristicValueDto } from './dto/findAll-value.dto'

@Roles(Role.Admin)
@Controller('system/characteristics/:characteristicId/values')
export class ValuesController {
  constructor(private readonly valuesService: ValuesService) {}

  @Post()
  create(
    @Param('characteristicId') characteristicId: string,
    @Body() createValueDto: CreateValueDto,
  ) {
    return this.valuesService.create(characteristicId, createValueDto)
  }

  @Get()
  findAll(
    @Query() query: FindAllCharacteristicValueDto,
    @Param('characteristicId') characteristicId?: string,
  ) {
    Logger.log(characteristicId)

    return this.valuesService.findAll(query, characteristicId)
  }

  @Get(':valueId')
  findOne(
    @Param('characteristicId') characteristicId: string,
    @Param('valueId') id: string,
  ) {
    return this.valuesService.findOne(characteristicId, id)
  }

  @Put(':valueId')
  update(
    @Param('characteristicId') characteristicId: string,
    @Param('valueId') id: string,
    @Body() updateValueDto: UpdateValueDto,
  ) {
    return this.valuesService.update(characteristicId, id, updateValueDto)
  }

  @Delete(':valueId')
  remove(
    @Param('characteristicId') characteristicId: string,
    @Param('valueId') id: string,
  ) {
    return this.valuesService.remove(characteristicId, id)
  }
}
