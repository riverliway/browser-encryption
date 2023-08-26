import React, { ReactNode, useEffect, useState } from 'react'
import { getCookie, setCookie } from './cookie'
import { hash } from '../crypto/hash'
import { decryptObject } from '../crypto/encrypt'
import { EncrytpedContexPattern } from '../types'

const COOKIE_NAME = 'BENCRYPTIONTOKEN'

interface EncryptedContextPackage<T> {
  /**
   * @returns the values stored in the context, decrypted
   */
  useEncryptedContext: () => T

  /**
   * This is the context that wraps any component that needs to access encrypted data.
   * If the user has logged in before, it reads their from their cookie.
   * If the user is not logged in, it prompts the user to log in.
   * @prop `children` - node to be rendered once the context is established
   * @prop `LoginScreen` - the component to be rendered that lets the user log in.
   * It must take the validatePassword function which returns if the password was successful or not
   */
  EncryptedProvider: React.FC<{
    children: ReactNode,
    LoginScreen: React.FC<{ validatePassword: (password: string) => Promise<boolean> }>
  }>
}

/**
 * Creates the context and provider for these encrypted profiles
 * @param encryptedDataProfiles - an array of objects.
 * Each object can have fields that contain encrypted values.
 * The hash must be the hash of the password to validate against.
 * @returns 
 */
export function setupEncryptedContext <T extends EncrytpedContexPattern>(encryptedDataProfiles: T[]): EncryptedContextPackage<T> {
  const EncryptedContext = React.createContext<T | undefined>(undefined)

  const useEncryptedContext = (): T => {
    const context = React.useContext(EncryptedContext)
    if (context === undefined) {
      throw new Error('EncryptedContext must be used within the EncryptedProvider')
    }
    return context
  }

  const EncryptedProvider: EncryptedContextPackage<T>['EncryptedProvider'] = props => {
    const [password, setPassword] = useState<string | undefined>()
    const [encryptedProfile, setEncryptedProfile] = useState<T | undefined>()
    const [decryptedProfile, setDecryptedProfile] = useState<T | undefined>()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      const asyncEffect = async (): Promise<void> => {
        const cookieCreds = getCookie(COOKIE_NAME)
        const cookieProfile = await validateCredentials(cookieCreds)

        if (cookieProfile !== undefined && cookieCreds !== undefined) {
          setCookie(COOKIE_NAME, cookieCreds, 1000)
          setPassword(cookieCreds)
          setEncryptedProfile(cookieProfile)
        } else {
          setLoading(false)
        }
      }

      void asyncEffect()
    }, [])

    useEffect(() => {
      const asyncEffect = async (): Promise<void> => {
        if (password === undefined || encryptedProfile === undefined) return
        
        const decryptedProfile = await decryptObject(password, encryptedProfile)
        setDecryptedProfile(decryptedProfile)
        setLoading(false)
      }

      void asyncEffect()
    }, [password, encryptedProfile])

    if (loading) return <div>Loading...</div>

    if (password === undefined || encryptedProfile === undefined || decryptedProfile === undefined) {
      const validatePassword = async (rawPassword: string): Promise<boolean> => {
        const password = await hash(rawPassword)
        const encryptedProfile = await validateCredentials(password)
        if (encryptedProfile !== undefined) {
          setCookie(COOKIE_NAME, password, 1000)
          setPassword(password)
          setEncryptedProfile(encryptedProfile)
          return true
        }

        return false
      }
      return <props.LoginScreen validatePassword={validatePassword} />
    }

    return (
      <EncryptedContext.Provider value={decryptedProfile}>
        {props.children}
      </EncryptedContext.Provider>
    )
  }

  /**
   * Checks if a set of credentials matches any of the encrypted profiles
   * @param creds - the credentials to check
   * @returns the encrypted profile that 
   */
  const validateCredentials = async (creds: string | undefined): Promise<T | undefined> => {
    if (creds === undefined) return undefined
    const hashedCreds = await hash(creds)
    return encryptedDataProfiles.find(p => p.hash === hashedCreds)
  }

  return {
    useEncryptedContext,
    EncryptedProvider
  }
}
