import { Injectable, NotFoundException } from '@nestjs/common'
import { DbService } from '../../db/db.service'
import { UpdateMeDto } from './dto/update-me.dto'
import { SendOtpDto } from '../auth/dto/send-otp.dto'
import { SmsService } from '../../sms/sms.service'

@Injectable()
export class CustomersService {
  constructor(
    private db: DbService,
    private smsService: SmsService,
  ) {}

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

  private verificationCodes = new Map<string, string>()

  async sendOtp(id: string, { phoneNumber }: SendOtpDto) {
    await this.getMe(id)

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    this.verificationCodes.set(phoneNumber, otp)
    return this.smsService.sendMessage(phoneNumber, otp)
  }
}
