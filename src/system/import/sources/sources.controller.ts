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
import { SourcesService } from './sources.service'
import { CreateSourceDto } from './dto/create-source.dto'
import { UpdateSourceDto } from './dto/update-source.dto'
import { FindAllSourceDto } from './dto/findAll-source.dto'

@Controller('system/import/sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Post()
  create(@Body() createSourceDto: CreateSourceDto) {
    return this.sourcesService.create(createSourceDto)
  }

  @Get()
  findAll(@Query() query: FindAllSourceDto) {
    return this.sourcesService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sourcesService.findOne(id)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateSourceDto: UpdateSourceDto) {
    return this.sourcesService.update(id, updateSourceDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sourcesService.remove(id)
  }
}
