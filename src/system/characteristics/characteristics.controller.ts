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
import { CharacteristicsService } from './characteristics.service'
import { CreateCharacteristicDto } from './dto/create-characteristic.dto'
import { UpdateCharacteristicDto } from './dto/update-characteristic.dto'
import { Roles } from '../common/decorators'
import { Role } from '../common/enums'
import { FindAllCharacteristicDto } from './dto/findAll-characteristic.dto'
import { AccessTokenGuard, RolesGuard } from '../common/guards'

@UseGuards(AccessTokenGuard)
@UseGuards(RolesGuard)
@Roles(Role.Admin)
@Controller('system/characteristics')
export class CharacteristicsController {
  constructor(
    private readonly characteristicsService: CharacteristicsService,
  ) {}

  @Post()
  create(@Body() createCharacteristicDto: CreateCharacteristicDto) {
    return this.characteristicsService.create(createCharacteristicDto)
  }

  @Get()
  findAll(@Query() query: FindAllCharacteristicDto) {
    return this.characteristicsService.findAll(query)
  }

  @Get('for-category')
  getCategoryCharacteristics(
    @Query() query: { categoryId?: string; categoryGroupId?: string },
  ) {
    return this.characteristicsService.getCategoryCharacteristics(query)
  }

  @Get(':characteristicId')
  findOne(@Param('characteristicId') id: string) {
    return this.characteristicsService.findOne(id)
  }

  @Put(':characteristicId')
  update(
    @Param('characteristicId') id: string,
    @Body() updateCharacteristicDto: UpdateCharacteristicDto,
  ) {
    return this.characteristicsService.update(id, updateCharacteristicDto)
  }

  @Delete(':characteristicId')
  remove(@Param('characteristicId') id: string) {
    return this.characteristicsService.remove(id)
  }
}
