import { Readable } from 'stream'
import * as xlsx from 'xlsx'
import * as csv from 'csv-parser'

export async function readExcelFile(buffer: Buffer) {
  const workbook = xlsx.read(buffer, { type: 'buffer' })
  const workSheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[workSheetName]
  return xlsx.utils.sheet_to_json(worksheet, { defval: '' })
}

export async function readCSVFile<T>(buffer: Buffer) {
  return new Promise((resolve, reject) => {
    const results: T[] = []
    const columnCounts: Record<string, number> = {}
    const stream = Readable.from(buffer.toString())

    stream
      .pipe(csv())
      .on('headers', (headers) => {
        headers.forEach((header, index) => {
          if (columnCounts[header] === undefined) {
            columnCounts[header] = 0
          } else {
            columnCounts[header]++
            headers[index] = `${header}_${columnCounts[header]}`
          }
        })
      })
      .on('data', (data) => {
        results.push(data)
      })
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error))
  })
}
