import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomOperationDto } from './create-custom-operation.dto';

export class UpdateCustomOperationDto extends PartialType(CreateCustomOperationDto) {}
