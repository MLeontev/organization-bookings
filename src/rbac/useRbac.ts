import { useContext } from 'react'
import { RbacContext } from './context'

export function useRbac() {
  const ctx = useContext(RbacContext)
  if (!ctx) {
    return {
      permissions: new Set<string>(),
      roles: new Set<string>(),
      can: () => false,
      hasRole: () => false,
    }
  }

  return ctx
}
