import { Controller, Get, Body, Post } from '@nestjs/common'
import { SoleProprietorInfoService } from './sole-proprietor-info.service'
import { EditSoleProprietorInfoDto } from './dto/edit-sole-proprietor-info.dto'
import { GetCurrentUserAccessToken, Roles } from '../common/decorators'
import { Role } from '../common/enums'

@Roles(Role.Admin)
@Controller('system/sole-proprietor-info')
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
