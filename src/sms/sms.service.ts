import { Injectable } from '@nestjs/common'

@Injectable()
export class SmsService {
  sendMessage(phoneNumber: string, message: string) {
    // Mock sending SMS
    console.log({
      phoneNumber,
      message,
    })
  }
}
