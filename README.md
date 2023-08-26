# browser-encryption
Necessary utilities for building encryption into a frontend React App.

## How to Use

This package provides the ability to have secret data (API keys, user information, etc.) hardcoded and stored into a frontend. The encrypted version of this data is statically provided to the `setupEncryptedContext` function. You may use the `encryptObject` utility provided to encrypt your data at compile time, and make it available to the frontend already encrytped.

When the React App loads, it will pass the encrytped data to the setup function, which results in a context to access the decrypted data, and a provider component to wrap your App in (at least the parts that need to use the encrypted data). The provider will check if the user has logged in previously via a cookie, and won't prompt for authentication if their credentials are stored in the cookie. If the user has not logged in before, it will render the `LoginScreen` component and wait for the user to enter their password. Once the password is obtained, it will decrypt the data and load the rest of the application, making the decrypted data for that user available via the context.

It is the user of this package's responsibility to implement the `LoginScreen`, as they may want to style it however they would like.

### Example:

```typescript
// Performed at compile time and stored somewhere
const passwords = ['Password for John', 'Password for Jane']
const encryptedProfiles = [{
  username: 'John',
  apiKey: 'abc123'
}, {
  username: 'Jane',
  apiKey: '123abc'
}].map((p, i) => encryptObject(passwords[i], p))

// Performed at runtime
const { useEncryptedContext, EncryptedProvider } = setupEncryptedContext(encryptedProfiles)
export useEncryptedContext

export const WrappedApp = React.FC = () => {
  return (
  	<EncryptedProvider LoginScreen={LoginScreen}>
    	<App />
    </EncryptedProvider>
  )
}

const LoginScreen = React.FC<{ validatePassword: (password: string) => Promise<boolean> }> = props => {
	// Logic to have a user enter their password and then call props.validatePassword                         
}
```

Now the `useEncryptedContext` is available to the rest of the application. When it is used, the profile for the user who logged in will be available in the `useEncryptedContext().data` field and the function to log out the user can be done by `useEncryptedContext().logout()`.

 
