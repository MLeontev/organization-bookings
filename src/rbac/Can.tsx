import { type ReactNode } from 'react'
import { useRbac } from './useRbac'

export function Can({
  permission,
  anyOf,
  allOf,
  role,
  fallback = null,
  children,
}: {
  permission?: string
  anyOf?: string[]
  allOf?: string[]
  role?: string
  fallback?: ReactNode
  children: ReactNode
}) {
  const { can, hasRole } = useRbac()

  const allowedByPermission = permission ? can(permission) : true
  const allowedByAnyOf = anyOf ? anyOf.some(can) : true
  const allowedByAllOf = allOf ? allOf.every(can) : true
  const allowedByRole = role ? hasRole(role) : true

  const allowed = allowedByPermission && allowedByAnyOf && allowedByAllOf && allowedByRole
  
  console.log({
    permission,
    canResult: permission ? can(permission) : null,
  })

  if (!allowed) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
