import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { Roles } from '../common/decorators'
import { Role } from '../common/enums'
import { StorageService } from './storage.service'
import { AccessTokenGuard, RolesGuard } from '../common/guards'

@UseGuards(AccessTokenGuard)
@UseGuards(RolesGuard)
@Roles(Role.Admin)
@Controller('system/storage')
export class StorageController {
  constructor(private storageService: StorageService) {}

  @Get()
  generatePresignedGetUrl(@Query('key') key: string) {
    return this.storageService.generatePresignedGetUrl(key)
  }

  @Post()
  generatePresignedPutUrl(@Query('key') key: string) {
    return this.storageService.generatePresignedPutUrl(key)
  }
}
