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
import { CollectionsService } from './collections.service'
import { CreateCollectionDto } from './dto/create-collection.dto'
import { UpdateCollectionDto } from './dto/update-collection.dto'
import { Roles } from '../common/decorators'
import { Role } from '../common/enums'
import { FindAllCollectionDto } from './dto/findAll-collection.dto'

@Roles(Role.Admin)
@Controller('system/collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  create(@Body() createCollectionDto: CreateCollectionDto) {
    return this.collectionsService.create(createCollectionDto)
  }

  @Get()
  findAll(@Query() query: FindAllCollectionDto) {
    return this.collectionsService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.collectionsService.findOne(id)
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateCollectionDto: UpdateCollectionDto,
  ) {
    return this.collectionsService.update(id, updateCollectionDto)
  }

  @Delete(':id')
  archive(@Param('id') id: string) {
    return this.collectionsService.archive(id)
  }

  @Put('restore/:id')
  restore(@Param('id') id: string) {
    return this.collectionsService.restore(id)
  }
}
