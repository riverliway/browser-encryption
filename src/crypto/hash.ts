
/**
 * Hashes an object using SHA-256
 * @param obj - Object to hash
 * @returns the hash of the object
 */
export const hash = async (obj: any): Promise<string> => {
  const encoded = new TextEncoder().encode(JSON.stringify(obj))
  const result = await global.crypto.subtle.digest('SHA-256', encoded)
  return new TextDecoder().decode(result)
}
