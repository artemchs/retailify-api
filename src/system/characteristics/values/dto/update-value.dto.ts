import { PartialType } from '@nestjs/mapped-types';
import { CreateValueDto } from './create-value.dto';

export class UpdateValueDto extends PartialType(CreateValueDto) {}
