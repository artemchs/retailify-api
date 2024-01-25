export function compareArrays<T>(
  oldArray: T[],
  newArray: T[],
  idField: keyof T,
  optionalField1?: keyof T,
  optionalField2?: keyof T,
): {
  updated: T[]
  deleted: T[]
  newItems: T[]
} {
  const updated: T[] = []
  let deleted: T[] = []
  const newItems: T[] = []

  const oldArrayMap = new Map(oldArray.map((obj) => [obj[idField], obj]))

  for (const newObj of newArray) {
    const oldObj = oldArrayMap.get(newObj[idField])

    if (!oldObj) {
      // New Item
      newItems.push(newObj)
    } else if (
      oldObj[idField] !== newObj[idField] ||
      (optionalField1 && oldObj[optionalField1] !== newObj[optionalField1]) ||
      (optionalField2 && oldObj[optionalField2] !== newObj[optionalField2])
    ) {
      // Updated Item
      updated.push(newObj)
    }

    oldArrayMap.delete(newObj[idField])
  }

  // Remaining items in oldArrayMap are deleted
  deleted = [...oldArrayMap.values()]

  return {
    updated,
    deleted,
    newItems,
  }
}
