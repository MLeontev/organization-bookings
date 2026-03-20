import { useEffect, useMemo, useState, type ReactNode } from 'react'
import keycloak from '../keycloak'
import { AuthContext, type AuthContextValue, type AuthStatus } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [username, setUsername] = useState('')

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        const authenticated = await keycloak.init({
          onLoad: 'check-sso',
          pkceMethod: false,
          checkLoginIframe: false,
        })

        if (!mounted) {
          return
        }

        if (authenticated) {
          setUsername(keycloak.tokenParsed?.preferred_username ?? '')
          setStatus('authenticated')
          return
        }

        setStatus('unauthenticated')
      } catch (error) {
        console.error('Keycloak initialization failed:', error)
        if (mounted) {
          setStatus('unauthenticated')
        }
      }
    }

    void initAuth()

    return () => {
      mounted = false
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    status,
    username,
    login: async (redirectUri?: string) => {
      await keycloak.login({ redirectUri: redirectUri ?? window.location.href })
    },
    logout: async () => {
      await keycloak.logout({ redirectUri: window.location.origin })
    },
  }), [status, username])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
