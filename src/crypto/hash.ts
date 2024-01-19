const forge = require('node-forge')
forge.options.usePureJavaScript = true

/**
 * Hashes an object using SHA-256
 * @param obj - Object to hash
 * @returns the hash of the object
 */
export const hash = (obj: any): string => {
  const hasher = forge.md.sha256.create()
  hasher.update(JSON.stringify(obj))
  return hasher.digest().toHex()
}
