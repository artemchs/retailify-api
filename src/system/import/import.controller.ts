import { Controller } from '@nestjs/common'
import { ImportService } from './import.service'

@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}
}
