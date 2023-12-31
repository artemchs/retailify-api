import { Body, Controller, Put } from '@nestjs/common'
import { UpdateMeDto } from './dto/update-me.dto'
import { GetCurrentUserAccessToken } from '../common/decorators'
import { ProfileService } from './profile.service'

@Controller('system/profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Put('me')
  updateMe(
    @Body() body: UpdateMeDto,
    @GetCurrentUserAccessToken('sub') userId: string,
  ) {
    return this.profileService.updateMe(body, userId)
  }
}
