import {
  checkIsArchived,
  buildOrderByArray,
  buildContainsArray,
  calculateTotalPages,
  getPaginationData,
} from '../db-helpers'

describe('checkIsArchived', () => {
  it('should return true when isArchived is truthy', () => {
    expect(checkIsArchived(1)).toBe(true)
  })

  it('should return false when isArchived is falsy', () => {
    expect(checkIsArchived(undefined)).toBe(false)
    expect(checkIsArchived(0)).toBe(false)
  })
})

describe('buildOrderByArray', () => {
  it('should return default sorting when orderBy is undefined', () => {
    expect(buildOrderByArray({ orderBy: undefined })).toEqual({
      createdAt: 'desc',
    })
  })

  it('should build an array of sorting objects from orderBy', () => {
    const orderBy: Record<string, 'desc' | 'asc' | undefined> = {
      field1: 'asc',
      field2: 'desc',
    }
    expect(buildOrderByArray({ orderBy })).toEqual([
      { field1: 'asc' },
      { field2: 'desc' },
    ])
  })
})

describe('buildContainsArray', () => {
  it('should return undefined when query is undefined', () => {
    expect(
      buildContainsArray({ fields: ['field1'], query: undefined }),
    ).toBeUndefined()
  })

  it('should build an array of contains objects from query and fields', () => {
    const query = 'search'
    const fields = ['field1', 'field2']
    expect(buildContainsArray({ fields, query })).toEqual([
      { field1: { contains: 'search' } },
      { field2: { contains: 'search' } },
    ])
  })
})

describe('calculateTotalPages', () => {
  it('should calculate the correct total pages', () => {
    expect(calculateTotalPages(20, 5)).toBe(4)
    expect(calculateTotalPages(15, 5)).toBe(3)
  })
})

describe('getPaginationData', () => {
  it('should return correct pagination data', () => {
    const result = getPaginationData({ page: 2, rowsPerPage: 10 })
    expect(result).toEqual({ take: 10, skip: 10 })
  })

  it('should handle undefined values for page and rowsPerPage', () => {
    const result = getPaginationData({
      page: 1,
      rowsPerPage: 10,
    })
    expect(result).toEqual({ take: 10, skip: 0 })
  })
})
