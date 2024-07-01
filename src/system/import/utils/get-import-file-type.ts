import { ImportFileType } from '@prisma/client'
import IMPORT_FILE_TYPES from './import-file-types'

function getImportFileType(contentType?: string): ImportFileType {
  let importFileType: ImportFileType = 'OTHER'

  if (contentType === IMPORT_FILE_TYPES.XLSX) {
    importFileType = 'XLSX'
  } else if (contentType === IMPORT_FILE_TYPES.XLS) {
    importFileType = 'XLS'
  } else if (contentType === IMPORT_FILE_TYPES.CSV) {
    importFileType = 'CSV'
  }

  return importFileType
}

export default getImportFileType
