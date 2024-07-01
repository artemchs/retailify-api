import { Injectable } from '@nestjs/common'
import { DbService } from '../../db/db.service'
import { StorageService } from '../storage/storage.service'

@Injectable()
export class CategoriesImportService {
  constructor(
    private readonly db: DbService,
    private readonly storage: StorageService,
  ) {}
}
