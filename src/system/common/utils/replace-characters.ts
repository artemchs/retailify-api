export function replaceCharacters(
  str: string,
  index1: number,
  index2: number,
  replacement: string,
): string {
  // Convert the string to an array
  const chars = str.split('')

  // Replace the characters at the specified positions
  chars[index1] = replacement[0]
  chars[index2] = replacement[1]

  // Join the array back into a string
  return chars.join('')
}
