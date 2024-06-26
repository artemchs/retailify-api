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
import { ColorsService } from './colors.service'
import { CreateColorDto } from './dto/create-color.dto'
import { UpdateColorDto } from './dto/update-color.dto'
import { Roles } from '../common/decorators'
import { Role } from '../common/enums'
import { FindAllColorDto } from './dto/findAll-color.dto'
import { AccessTokenGuard, RolesGuard } from '../common/guards'

@Controller('system/colors')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(Role.Admin)
export class ColorsController {
  constructor(private readonly colorsService: ColorsService) {}

  @Post()
  create(@Body() createColorDto: CreateColorDto) {
    return this.colorsService.create(createColorDto)
  }

  @Get()
  findAll(@Query() query: FindAllColorDto) {
    return this.colorsService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.colorsService.findOne(id)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateColorDto: UpdateColorDto) {
    return this.colorsService.update(id, updateColorDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.colorsService.remove(id)
  }
}
