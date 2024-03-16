import { IsNotEmpty, IsNumber } from 'class-validator'

export class CashRegisterTransactionDto {
  @IsNotEmpty()
  @IsNumber()
  amount: number
}
