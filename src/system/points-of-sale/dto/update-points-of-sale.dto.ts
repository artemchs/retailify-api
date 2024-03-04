import { PartialType } from '@nestjs/mapped-types';
import { CreatePointsOfSaleDto } from './create-points-of-sale.dto';

export class UpdatePointsOfSaleDto extends PartialType(CreatePointsOfSaleDto) {}
