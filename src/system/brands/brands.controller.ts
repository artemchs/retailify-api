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
import { BrandsService } from './brands.service'
import { CreateBrandDto } from './dto/create-brand.dto'
import { UpdateBrandDto } from './dto/update-brand.dto'
import { FindAllBrandDto } from './dto/findAll-brand.dto'
import { Roles } from '../common/decorators'
import { Role } from '../common/enums'
import { AccessTokenGuard } from '../common/guards'

@Roles(Role.Admin)
@UseGuards(AccessTokenGuard)
@Controller('system/brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  create(@Body() createBrandDto: CreateBrandDto) {
    return this.brandsService.create(createBrandDto)
  }

  @Get()
  findAll(@Query() query: FindAllBrandDto) {
    return this.brandsService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.brandsService.findOne(id)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateBrandDto: UpdateBrandDto) {
    return this.brandsService.update(id, updateBrandDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.brandsService.remove(id)
  }
}
