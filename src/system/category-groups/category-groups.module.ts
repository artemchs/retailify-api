import { Module } from '@nestjs/common'
import { CategoryGroupsService } from './category-groups.service'
import { CategoryGroupsController } from './category-groups.controller'

@Module({
  controllers: [CategoryGroupsController],
  providers: [CategoryGroupsService],
  imports: [],
})
export class CategoryGroupsModule {}
