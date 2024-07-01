import { Module } from '@nestjs/common'
import { ImportController } from './import.controller'
import { SourcesModule } from './sources/sources.module'
import { ProductsImportService } from './products-import.service'

@Module({
  controllers: [ImportController],
  providers: [ProductsImportService],
  imports: [SourcesModule],
})
export class ImportModule {}
