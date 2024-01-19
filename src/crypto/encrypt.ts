import { EncrytpedContexPattern } from '../types'
import { hash } from './hash'
const forge = require('node-forge')
forge.options.usePureJavaScript = true

const ENCRYPT_ALGO = 'AES-GCM'
const iv = forge.random.getBytesSync(16)
const salt = forge.random.getBytesSync(128)

/**
 * Encrypts an object using SHA-256
 * @param obj - Object to encrypt
 * @returns the encrypted version of the object
 */
export const encrypt = (password: string, obj: any): string => {
  const cipher = forge.cipher.createCipher(ENCRYPT_ALGO, createKey(password))
  cipher.start({ iv })

  cipher.update(forge.util.createBuffer(JSON.stringify(obj)))
  cipher.finish()

  return cipher.output.toHex()
}

/**
 * Decrypts an object using SHA-256
 * @param encrypted - Encrypted object
 * @returns the decrypted version of the object
 */
export const decrypt = (password: string, encrypted: string): any => {
  const decipher = forge.cipher.createDecipher(ENCRYPT_ALGO, createKey(password))
  decipher.start({ iv })

  decipher.update(forge.util.createBuffer(forge.util.hexToBytes(encrypted)))
  decipher.finish()

  return JSON.parse(decipher.output.toString())
}

/**
 * Encrypts each field of an object using a password
 * @param password - The password to encrypt the object with (in plaintext)
 * @param obj - the object to encrypt
 * @returns a new object where each of the fields are the encrytped verion of the object passed in
 */
export const encryptObject = <T extends Omit<EncrytpedContexPattern, 'hash'>>(rawPassword: string, obj: T): T & { hash: string } => {
  const password = hash(rawPassword)

  let encryptedProfile = {} as T
  Object.keys(obj).map((key: keyof T) => {
    if (key === 'hash') return
    encryptedProfile[key] = encrypt(password, obj[key]) as T[keyof T]
  })

  const encryptedProfileWithHash = encryptedProfile as T & { hash: string }
  encryptedProfileWithHash.hash = hash(password)
  return encryptedProfileWithHash
}

/**
 * Decrypts each field of an object using a password. Does not check for password validity before attempting
 * @param hashedPassword - the hashed version of the password
 * @param obj - the encrypted object
 * @returns a new object where each of the fields are the decrypted version of the object passed in
 */
export const decryptObject = <T extends EncrytpedContexPattern>(hashedPassword: string, obj: T): T => {
  let decryptedProfile = { hash: obj.hash } as T
  Object.keys(obj).map((key: keyof T) => {
    if (key === 'hash') return
    decryptedProfile[key] = decrypt(hashedPassword, obj[key])
  })

  return decryptedProfile
}

/**
 * @param password - the password to hash
 * @returns a key to use for encryption which is a salted hash of the password
 */
const createKey = (password: string): string => {
  return forge.pkcs5.pbkdf2(password, salt, 40, 32)
}
