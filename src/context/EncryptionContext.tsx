import React, { ReactNode, useEffect, useState } from 'react'
import { getCookie, removeCookie, setCookie } from './cookie'
import { hash } from '../crypto/hash'
import { decryptObject } from '../crypto/encrypt'
import { EncrytpedContexPattern } from '../types'

const COOKIE_NAME = 'BENCRYPTIONTOKEN'

interface EncryptedContextPackage<T> {
  /**
   * @returns the values stored in the context, decrypted.
   * It also returns a function that when called, logs out the user and removes any credentials stored
   */
  useEncryptedContext: () => { data: T, logout: () => void }

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
    LoginScreen: React.FC<{ validatePassword: (password: string) => boolean }>
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
  type EncryptionContextItem = ReturnType<EncryptedContextPackage<T>['useEncryptedContext']>
  const EncryptedContext = React.createContext<EncryptionContextItem | undefined>(undefined)

  const useEncryptedContext = (): EncryptionContextItem => {
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
      const cookieCreds = getCookie(COOKIE_NAME)
      const cookieProfile = validateCredentials(cookieCreds)

      if (cookieProfile !== undefined && cookieCreds !== undefined) {
        setCookie(COOKIE_NAME, cookieCreds, 1000)
        setPassword(cookieCreds)
        setEncryptedProfile(cookieProfile)
      } else {
        setLoading(false)
      }
    }, [])

    useEffect(() => {
      if (password === undefined || encryptedProfile === undefined) return
        
      const decryptedProfile = decryptObject(password, encryptedProfile)
      setDecryptedProfile(decryptedProfile)
      setLoading(false)
    }, [password, encryptedProfile])

    if (loading) return <div>Loading...</div>

    if (password === undefined || encryptedProfile === undefined || decryptedProfile === undefined) {
      const validatePassword = (rawPassword: string): boolean => {
        const password = hash(rawPassword)
        const encryptedProfile = validateCredentials(password)
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

    const value = {
      data: decryptedProfile,
      logout: () => {
        removeCookie(COOKIE_NAME)
        setDecryptedProfile(undefined)
        setPassword(undefined)
        setEncryptedProfile(undefined)
      }
    }

    return (
      <EncryptedContext.Provider value={value}>
        {props.children}
      </EncryptedContext.Provider>
    )
  }

  /**
   * Checks if a set of credentials matches any of the encrypted profiles
   * @param creds - the credentials to check
   * @returns the encrypted profile that 
   */
  const validateCredentials = (creds: string | undefined): T | undefined => {
    if (creds === undefined) return undefined
    const hashedCreds = hash(creds)
    return encryptedDataProfiles.find(p => p.hash === hashedCreds)
  }

  return {
    useEncryptedContext,
    EncryptedProvider
  }
}
