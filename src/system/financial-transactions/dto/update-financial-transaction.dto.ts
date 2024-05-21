import { PartialType } from '@nestjs/mapped-types';
import { CreateFinancialTransactionDto } from './create-financial-transaction.dto';

export class UpdateFinancialTransactionDto extends PartialType(CreateFinancialTransactionDto) {}
