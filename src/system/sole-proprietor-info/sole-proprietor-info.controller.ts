import { Controller, Get, Body, Post, UseGuards } from '@nestjs/common'
import { SoleProprietorInfoService } from './sole-proprietor-info.service'
import { EditSoleProprietorInfoDto } from './dto/edit-sole-proprietor-info.dto'
import { GetCurrentUserAccessToken, Roles } from '../common/decorators'
import { Role } from '../common/enums'
import { AccessTokenGuard, RolesGuard } from '../common/guards'

@Controller('system/sole-proprietor-info')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(Role.Admin)
export class SoleProprietorInfoController {
  constructor(
    private readonly soleProprietorInfoService: SoleProprietorInfoService,
  ) {}

  @Get()
  findOne(@GetCurrentUserAccessToken('sub') userId: string) {
    return this.soleProprietorInfoService.findOne(userId)
  }

  @Post()
  edit(
    @GetCurrentUserAccessToken('sub') userId: string,
    @Body() editSoleProprietorInfoDto: EditSoleProprietorInfoDto,
  ) {
    return this.soleProprietorInfoService.edit(
      userId,
      editSoleProprietorInfoDto,
    )
  }
}
