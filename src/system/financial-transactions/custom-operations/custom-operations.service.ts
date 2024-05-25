import { Injectable } from '@nestjs/common'
import { CreateCustomOperationDto } from './dto/create-custom-operation.dto'
import { UpdateCustomOperationDto } from './dto/update-custom-operation.dto'
import { DbService } from '../../../db/db.service'
import { FindAllCustomOperationDto } from './dto/findAll-custom-operation.dto'

@Injectable()
export class CustomOperationsService {
  constructor(private db: DbService) {}

  async create(createCustomOperationDto: CreateCustomOperationDto) {
    return await this.db.customFinancialOperation.create({
      data: createCustomOperationDto,
    })
  }

  async findAll({ cursor, query }: FindAllCustomOperationDto) {
    return `This action returns all customOperations`
  }

  async findOne(id: string) {
    return `This action returns a #${id} customOperation`
  }

  async update(id: string, updateCustomOperationDto: UpdateCustomOperationDto) {
    return `This action updates a #${id} customOperation`
  }

  async remove(id: string) {
    return `This action removes a #${id} customOperation`
  }
}
