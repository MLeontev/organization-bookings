import { useMemo, type ReactNode } from 'react'
import { RbacContext } from './context'

export function RbacProvider({
  permissions,
  roles,
  children,
}: {
  permissions: string[]
  roles: string[]
  children: ReactNode
}) {
  const value = useMemo(() => {
    const permissionsSet = new Set(permissions)
    const rolesSet = new Set(roles)

    return {
      permissions: permissionsSet,
      roles: rolesSet,
      can: (permission: string) => permissionsSet.has(permission),
      hasRole: (role: string) => rolesSet.has(role),
    }
  }, [permissions, roles])

  return <RbacContext.Provider value={value}>{children}</RbacContext.Provider>
}
