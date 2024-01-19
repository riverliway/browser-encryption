const forge = require('node-forge')
forge.options.usePureJavaScript = true

const hasher = forge.md.sha256.create()

/**
 * Hashes an object using SHA-256
 * @param obj - Object to hash
 * @returns the hash of the object
 */
export const hash = (obj: any): string => {
  hasher.update(JSON.stringify(obj))
  return hasher.digest().toHex()
}
