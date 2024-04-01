import { Module } from '@nestjs/common'
import { FiscalApiService } from './fiscal-api.service'
import { HttpModule } from '@nestjs/axios'

@Module({
  providers: [FiscalApiService],
  imports: [HttpModule],
})
export class FiscalApiModule {}
