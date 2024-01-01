import { Body, Controller, Put } from '@nestjs/common'
import { UpdateMeDto } from './dto/update-me.dto'
import { GetCurrentUserAccessToken } from '../common/decorators'
import { UsersService } from './users.service'

@Controller('system/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Put('me')
  updateMe(
    @Body() body: UpdateMeDto,
    @GetCurrentUserAccessToken('sub') userId: string,
  ) {
    return this.usersService.updateMe(body, userId)
  }
}
