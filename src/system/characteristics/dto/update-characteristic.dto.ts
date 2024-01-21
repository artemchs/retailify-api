import { PartialType } from '@nestjs/mapped-types';
import { CreateCharacteristicDto } from './create-characteristic.dto';

export class UpdateCharacteristicDto extends PartialType(CreateCharacteristicDto) {}
