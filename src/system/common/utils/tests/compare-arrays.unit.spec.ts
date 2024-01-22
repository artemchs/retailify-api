import { compareArrays } from '../compare-arrays'

describe('compareArrays', () => {
  it('should correctly identify updated items', () => {
    const oldArray = [{ id: 1, value: 'A' }]
    const newArray = [{ id: 1, value: 'B' }]
    const result = compareArrays(oldArray, newArray, 'id', 'value')

    expect(result.updated).toEqual(newArray)
    expect(result.deleted).toEqual([])
    expect(result.newItems).toEqual([])
  })

  it('should correctly identify deleted items', () => {
    const oldArray = [{ id: 1, value: 'A' }]
    const newArray: any[] = []
    const result = compareArrays(oldArray, newArray, 'id', 'value')

    expect(result.updated).toEqual([])
    expect(result.deleted).toEqual(oldArray)
    expect(result.newItems).toEqual([])
  })

  it('should correctly identify new items', () => {
    const oldArray: any[] = []
    const newArray = [{ id: 1, value: 'A' }]
    const result = compareArrays(oldArray, newArray, 'id', 'value')

    expect(result.updated).toEqual([])
    expect(result.deleted).toEqual([])
    expect(result.newItems).toEqual(newArray)
  })

  it('should work correctly with optionalField', () => {
    const oldArray = [{ id: 1, value: 'A', optional: 'X' }]
    const newArray = [{ id: 1, value: 'A', optional: 'X' }]
    const result = compareArrays(oldArray, newArray, 'id', 'optional')

    expect(result.updated).toEqual([])
    expect(result.deleted).toEqual([])
    expect(result.newItems).toEqual([])
  })

  it('should handle empty arrays', () => {
    const oldArray: any[] = []
    const newArray: any[] = []
    const result = compareArrays(oldArray, newArray, 'id')

    expect(result.updated).toEqual([])
    expect(result.deleted).toEqual([])
    expect(result.newItems).toEqual([])
  })
})
