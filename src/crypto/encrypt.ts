import { EncrytpedContexPattern } from '../types'
import { hash } from './hash'

const SALT = '1*b99a-84ffhysim294&w22'
const KEY_ALGO = 'PBKDF2'
const ENCRYPT_ALGO = 'AES-GCM'

/**
 * Encrypts an object using SHA-256
 * @param obj - Object to encrypt
 * @returns the encrypted version of the object
 */
export const encrypt = async (password: string, obj: any): Promise<string> => {
  const key = await createKey(password)
  const result = await global.crypto.subtle.encrypt(ENCRYPT_ALGO, key, obj)
  return new TextDecoder().decode(result)
}

/**
 * Decrypts an object using SHA-256
 * @param encrypted - Encrypted object
 * @returns the decrypted version of the object
 */
export const decrypt = async (password: string, encrypted: string): Promise<any> => {
  const key = await createKey(password)
  const encryptedBuffer = Buffer.from(encrypted, 'base64')
  const decrypted = await global.crypto.subtle.decrypt(ENCRYPT_ALGO, key, encryptedBuffer)
  return JSON.parse(new TextDecoder().decode(decrypted))
}

/**
 * Encrypts each field of an object using a password
 * @param password - The password to encrypt the object with (in plaintext)
 * @param obj - the object to encrypt
 * @returns a new object where each of the fields are the encrytped verion of the object passed in
 */
export const encryptObject = async <T extends Omit<EncrytpedContexPattern, 'hash'>>(rawPassword: string, obj: T): Promise<T & { hash: string }> => {
  const password = await hash(rawPassword)

  let encryptedProfile = {} as T
  const encryptionJobs = Object.keys(obj).map((key: keyof T) => {
    return async (): Promise<void> => {
      if (key === 'hash') return
      encryptedProfile[key] = await encrypt(password, obj[key]) as T[keyof T]
    }
  })

  await Promise.all(encryptionJobs)

  const encryptedProfileWithHash = encryptedProfile as T & { hash: string }
  encryptedProfileWithHash.hash = await hash(password)
  return encryptedProfileWithHash
}

/**
 * Decrypts each field of an object using a password. Does not check for password validity before attempting
 * @param hashedPassword - the hashed version of the password
 * @param obj - the encrypted object
 * @returns a new object where each of the fields are the decrypted version of the object passed in
 */
export const decryptObject = async <T extends EncrytpedContexPattern>(hashedPassword: string, obj: T): Promise<T> => {
  let decryptedProfile = { hash: obj.hash } as T
  const decryptionJobs = Object.keys(obj).map((key: keyof T) => {
    return async (): Promise<void> => {
      if (key === 'hash') return
      decryptedProfile[key] = await decrypt(hashedPassword, obj[key])
    }
  })

  await Promise.all(decryptionJobs)
  return decryptedProfile
}

/**
 * Creates the key to use to encrypt the object
 * @param password - Password to use to encrypt the object
 * @returns the key to use to encrypt the object
 */
const createKey = async (password: string): Promise<CryptoKey> => {
  const passBuffer = Buffer.from(password, 'utf-8')
  const saltBuffer = Buffer.from(SALT, 'base64')

  const keyConfig = {
    name: KEY_ALGO,
    salt: saltBuffer,
    iterations: 10000,
    hash: 'SHA-256',
  }

  const importedKey = await global.crypto.subtle.importKey(
    'raw',
    passBuffer,
    { name: KEY_ALGO },
    false,
    ['deriveBits', 'deriveKey'],
  )

  return await global.crypto.subtle.deriveKey(keyConfig, importedKey, { name: ENCRYPT_ALGO, length: 256 }, true, ['encrypt', 'decrypt'])
}
