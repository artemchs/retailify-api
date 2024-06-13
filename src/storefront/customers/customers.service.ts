import { Injectable, NotFoundException } from '@nestjs/common'
import { DbService } from '../../db/db.service'
import { UpdateMeDto } from './dto/update-me.dto'

@Injectable()
export class CustomersService {
  constructor(private db: DbService) {}

  async getMe(id: string) {
    const customer = await this.db.customer.findUnique({
      where: {
        id,
      },
    })

    if (!customer) {
      throw new NotFoundException('Ваш обліковий запис не знайдено.')
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { rtHash, ...result } = customer

    return result
  }

  async updateMe(id: string, body: UpdateMeDto) {
    await this.getMe(id)

    return await this.db.customer.update({
      where: {
        id,
      },
      data: body,
    })
  }
}
