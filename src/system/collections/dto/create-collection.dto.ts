import { Type } from 'class-transformer'
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

export class CollectionDefaultCharacteristic {
  @IsNotEmpty({ message: 'Идентификатор характеристики не должен быть пустым' })
  @IsString({ message: 'Идентификатор характеристики должен быть строкой' })
  id: string
}

export class CollectionProduct {
  @IsNotEmpty({ message: 'Идентификатор продукта не должен быть пустым' })
  @IsString({ message: 'Идентификатор продукта должен быть строкой' })
  id: string
}

export class CreateCollectionDto {
  @IsNotEmpty({ message: 'Наименование коллекции не должно быть пустым' })
  @IsString({ message: 'Наименование коллекции должно быть строкой' })
  name: string

  @IsOptional()
  @IsString({
    message: 'Идентификатор родительской коллекции должен быть строкой',
  })
  parentId?: string

  @IsOptional({ message: 'Характеристики коллекции должны быть корректными' })
  @ValidateNested({ each: true })
  @Type(() => CollectionDefaultCharacteristic)
  characteristics?: CollectionDefaultCharacteristic[]

  @IsOptional({ message: 'Продукты коллекции должны быть корректными' })
  @ValidateNested({ each: true })
  @Type(() => CollectionProduct)
  products?: CollectionProduct[]
}
