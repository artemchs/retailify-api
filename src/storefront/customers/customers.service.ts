import { Injectable, NotFoundException } from '@nestjs/common'
import { DbService } from '../../db/db.service'

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
}
