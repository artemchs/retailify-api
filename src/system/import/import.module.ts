import { Module } from '@nestjs/common'
import { ImportController } from './import.controller'
import { SourcesModule } from './sources/sources.module'
import { ProductsImportService } from './products-import.service'
import { CategoriesImportService } from './categories-import.service'

@Module({
  controllers: [ImportController],
  providers: [ProductsImportService, CategoriesImportService],
  imports: [SourcesModule],
})
export class ImportModule {}
