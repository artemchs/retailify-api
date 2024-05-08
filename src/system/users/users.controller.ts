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
  UseInterceptors,
} from '@nestjs/common'
import { GetCurrentUserAccessToken, Roles } from '../common/decorators'
import { UsersService } from './users.service'
import { FileInterceptor } from '@nestjs/platform-express'
import { UpdateMeDto, UpdatePasswordDto } from './dto'
import { Response } from 'express'
import { setRefreshTokenCookie } from '../common/utils/set-refresh-token'
import { Role } from '../common/enums'

@Controller('system/users')
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

  @Roles(Role.Admin)
  @Put('/me/password')
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
