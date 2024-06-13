import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { DbService } from '../../db/db.service'
import { UpdateMeDto } from './dto/update-me.dto'
import { SendOtpDto } from '../auth/dto/send-otp.dto'
import { SmsService } from '../../sms/sms.service'
import { UpdateMyPhoneNumber } from './dto/update-my-phone-number.dto'

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

    const customer = await this.db.customer.update({
      where: {
        id,
      },
      data: body,
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { rtHash, ...result } = customer

    return result
  }

  private verificationCodes = new Map<string, string>()

  async sendOtp(id: string, { phoneNumber }: SendOtpDto) {
    await this.getMe(id)

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    this.verificationCodes.set(phoneNumber, otp)
    this.smsService.sendMessage(phoneNumber, otp)

    return {
      msg: 'OTP has been sent.',
    }
  }

  async updateMyPhoneNumber(
    id: string,
    { phoneNumber, otp }: UpdateMyPhoneNumber,
  ) {
    const validOtp = this.verificationCodes.get(phoneNumber)

    if (!validOtp || validOtp !== otp)
      throw new BadRequestException('Код, який ви надіслали, є недійсним.')

    const customer = await this.db.customer.update({
      where: {
        id,
      },
      data: {
        phoneNumber,
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { rtHash, ...result } = customer

    return result
  }
}
