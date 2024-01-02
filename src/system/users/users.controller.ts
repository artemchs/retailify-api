import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  ParseFilePipe,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { UpdateMeDto } from './dto/update-me.dto'
import { GetCurrentUserAccessToken } from '../common/decorators'
import { UsersService } from './users.service'
import { FileInterceptor } from '@nestjs/platform-express'

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
}
