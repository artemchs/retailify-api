import { Module } from '@nestjs/common'
import { ImportService } from './import.service'
import { ImportController } from './import.controller'
import { SourcesModule } from './sources/sources.module'

@Module({
  controllers: [ImportController],
  providers: [ImportService],
  imports: [SourcesModule],
})
export class ImportModule {}
