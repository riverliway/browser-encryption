
/**
 * Get the value of a cookie
 * @param cname - the name of the cookie to look up
 * @returns the value of the cookie, if it exists
 */
export const getCookie = (cname: string): string | undefined => {
  const name = cname + '='
  const decodedCookie = decodeURIComponent(document.cookie)
  const ca = decodedCookie.split(';')

  const cookie = ca.find(c => c.trim().startsWith(name))
  const cleaned = cookie?.slice(name.length).trim()
  return cleaned?.replace('=', '').replace(';', '')
}

/**
 * Sends a cookie in the browser with a given expiration date
 * @param cname - the name of the cookie
 * @param cvalue - the value of the cookie
 * @param expDays - the number of days to expire in
 */
export const setCookie = (cname: string, cvalue: string, expDays: number): void => {
  if (cvalue.includes(';') || cvalue.includes('=')) {
    throw new Error('Cookie value cannot contain semicolons or equals signs')
  }

  const d = new Date()
  d.setTime(d.getTime() + expDays * 24 * 60 * 60 * 1000)
  const expires = `expires=${d.toUTCString()}`
  document.cookie = `${cname}=${cvalue};${expires};path=/`
}
