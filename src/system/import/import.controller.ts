import { Body, Controller, Post } from '@nestjs/common'
import { ImportService } from './import.service'
import { CreateImportDto } from './dto/create-import.dto'

@Controller('system/import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post()
  create(@Body() body: CreateImportDto) {
    return this.importService.create(body)
  }
}
