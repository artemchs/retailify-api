import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Put,
} from '@nestjs/common'
import { CategoriesService } from './categories.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'
import {
  FindAllCategoryDto,
  FindAllInfiniteListCategoryDto,
} from './dto/findAll-category.dto'
import { Roles } from '../common/decorators'
import { Role } from '../common/enums'

@Roles(Role.Admin)
@Controller('system/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto)
  }

  @Get()
  findAll(@Query() query: FindAllCategoryDto) {
    return this.categoriesService.findAll(query)
  }

  @Get('infinite-list')
  findAllInfiniteList(@Query() query: FindAllInfiniteListCategoryDto) {
    return this.categoriesService.findAllInfiniteList(query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id)
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto)
  }

  @Delete(':id')
  archive(@Param('id') id: string) {
    return this.categoriesService.archive(id)
  }

  @Put('restore/:id')
  restore(@Param('id') id: string) {
    return this.categoriesService.restore(id)
  }
}
