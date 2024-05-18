import { Injectable, NotFoundException } from '@nestjs/common'
import { EditSoleProprietorInfoDto } from './dto/edit-sole-proprietor-info.dto'
import { DbService } from '../../db/db.service'
import { compareArrays } from '../common/utils/compare-arrays'

@Injectable()
export class SoleProprietorInfoService {
  constructor(private db: DbService) {}

  private async findInfo(userId: string) {
    const info = await this.db.soleProprietorInfo.findFirst({
      where: {
        systemUser: {
          id: userId,
        },
      },
      include: {
        currentAccounts: true,
      },
    })

    if (!info) {
      throw new NotFoundException('Инфо не найдено.')
    }

    return info
  }

  async findOne(userId: string) {
    return this.findInfo(userId)
  }

  async edit(
    userId: string,
    editSoleProprietorInfoDto: EditSoleProprietorInfoDto,
  ) {
    const info = await this.findInfo(userId)

    if (info && info.id) {
      const compareArraysRes = editSoleProprietorInfoDto.currentAccounts
        ? compareArrays(
            info.currentAccounts,
            editSoleProprietorInfoDto?.currentAccounts,
            'id',
            'iban',
            'name',
          )
        : undefined

      return this.db.soleProprietorInfo.update({
        where: {
          id: info.id,
        },
        data: {
          tin: editSoleProprietorInfoDto.tin,
          currentAccounts:
            editSoleProprietorInfoDto.currentAccounts &&
            (compareArraysRes?.newItems ||
              compareArraysRes?.updated ||
              compareArraysRes?.deleted)
              ? {
                  createMany: {
                    data: compareArraysRes?.newItems,
                  },
                  deleteMany: compareArraysRes?.deleted,
                  updateMany: compareArraysRes?.updated.map(
                    ({ iban, name, id }) => ({
                      where: {
                        id,
                      },
                      data: {
                        name,
                        iban,
                      },
                    }),
                  ),
                }
              : undefined,
        },
      })
    }
  }
}
