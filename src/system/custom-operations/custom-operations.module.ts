import { Module } from '@nestjs/common'
import { CustomOperationsService } from './custom-operations.service'
import { CustomOperationsController } from './custom-operations.controller'

@Module({
  controllers: [CustomOperationsController],
  providers: [CustomOperationsService],
})
export class CustomOperationsModule {}
