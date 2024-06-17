import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { Roles } from '../common/decorators'
import { Role } from '../common/enums'
import { StorageService } from './storage.service'
import { AccessTokenGuard, RolesGuard } from '../common/guards'
import { GeneratePresignedPutUrlDto } from './dto/generate-presigned-put-url.dto'

@Controller('system/storage')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(Role.Admin)
export class StorageController {
  constructor(private storageService: StorageService) {}

  @Get()
  generatePresignedGetUrl(@Query('key') key: string) {
    return this.storageService.generatePresignedGetUrl(key)
  }

  @Post()
  generatePresignedPutUrl(@Body() body: GeneratePresignedPutUrlDto) {
    return this.storageService.generatePresignedPutUrl(body)
  }
}
