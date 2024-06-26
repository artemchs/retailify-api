import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  ParseFilePipe,
  Put,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { GetCurrentUserAccessToken, Roles } from '../common/decorators'
import { UsersService } from './users.service'
import { FileInterceptor } from '@nestjs/platform-express'
import { UpdateMeDto, UpdatePasswordDto } from './dto'
import { Response } from 'express'
import { setRefreshTokenCookie } from '../common/utils/set-refresh-token'
import { Role } from '../common/enums'
import { AccessTokenGuard, RolesGuard } from '../common/guards'

@Controller('system/users')
@UseGuards(AccessTokenGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getMe(@GetCurrentUserAccessToken('sub') userId: string) {
    return this.usersService.getMe(userId)
  }

  @UseInterceptors(FileInterceptor('profilePicture'))
  @Put('me')
  updateMe(
    @Body() body: UpdateMeDto,
    @GetCurrentUserAccessToken('sub') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new FileTypeValidator({ fileType: 'image/*' }) as any,
          new MaxFileSizeValidator({
            maxSize: 1024 * 1024,
            message: 'Максимальный размер файла не должен превышать 1 МБ',
          }),
        ],
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.usersService.updateMe(body, userId, file?.buffer)
  }

  @Put('/me/password')
  @Roles(Role.Admin)
  async updatePassword(
    @Body() body: UpdatePasswordDto,
    @GetCurrentUserAccessToken('sub') userId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.usersService.updatePassword(body.password, userId)
    setRefreshTokenCookie(response, '')
  }

  @Get('my-points-of-sale')
  findMyPointsOfSale(@GetCurrentUserAccessToken('sub') userId: string) {
    return this.usersService.findMyPointsOfSale(userId)
  }
}
