import { IsEnum, IsNotEmpty } from 'class-validator'

export enum GeneratePresignedPutUrlDir {
  IMPORT = 'Import',
  EXPORT = 'Export',
  MEDIA = 'Media',
  OTHER = 'Other',
}

export class GeneratePresignedPutUrlDto {
  @IsNotEmpty()
  @IsEnum(GeneratePresignedPutUrlDir)
  dir: GeneratePresignedPutUrlDir
}
