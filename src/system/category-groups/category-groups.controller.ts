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
import { CategoryGroupsService } from './category-groups.service'
import { CreateCategoryGroupDto } from './dto/create-category-group.dto'
import { UpdateCategoryGroupDto } from './dto/update-category-group.dto'
import {
  FindAllCategoryGroupDto,
  FindAllInfiniteListCategoryGroupDto,
} from './dto/findAll-category-group-dto'
import { Roles } from '../../system/common/decorators'
import { Role } from '../../system/common/enums'

@Roles(Role.Admin)
@Controller('system/category-groups')
export class CategoryGroupsController {
  constructor(private readonly categoryGroupsService: CategoryGroupsService) {}

  @Post()
  create(@Body() createCategoryGroupDto: CreateCategoryGroupDto) {
    return this.categoryGroupsService.create(createCategoryGroupDto)
  }

  @Get()
  findAll(@Query() query: FindAllCategoryGroupDto) {
    return this.categoryGroupsService.findAll(query)
  }

  @Get('infinite-list')
  findAllInfiniteList(@Query() query: FindAllInfiniteListCategoryGroupDto) {
    return this.categoryGroupsService.findAllInfiniteList(query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoryGroupsService.findOne(id)
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryGroupDto: UpdateCategoryGroupDto,
  ) {
    return this.categoryGroupsService.update(id, updateCategoryGroupDto)
  }

  @Delete(':id')
  archive(@Param('id') id: string) {
    return this.categoryGroupsService.archive(id)
  }

  @Put('restore/:id')
  restore(@Param('id') id: string) {
    return this.categoryGroupsService.restore(id)
  }
}
