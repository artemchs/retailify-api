import { Injectable } from '@nestjs/common'

@Injectable()
export class SmsService {
  sendOtp(phoneNumber: string, otp: string) {
    // Mock sending SMS
    console.log(
      `Sending SMS to ${phoneNumber}: Your one time password is ${otp}`,
    )
  }
}
