import { createContext } from 'react'

type RbacContextValue = {
  permissions: Set<string>
  roles: Set<string>
  can: (permission: string) => boolean
  hasRole: (role: string) => boolean
}

export const RbacContext = createContext<RbacContextValue | null>(null)
