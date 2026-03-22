import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '../components/Alert'
import { acceptInvitationByToken, getInvitationByToken, type InvitationByToken } from '../api/orgMembershipApi'
import { useAuth } from '../auth/useAuth'
import { formatInvitationStatus } from '../utils/statuses'
import { formatRoleLabel } from '../utils/roles'

export function InvitationPage() {
  const { token = '' } = useParams()
  const { status, login } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [invitation, setInvitation] = useState<InvitationByToken | null>(null)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await getInvitationByToken(token)
        if (!mounted) {
          return
        }
        setInvitation(response)
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Не удалось загрузить приглашение')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    if (token) {
      void load()
    }

    return () => {
      mounted = false
    }
  }, [token])

  const handleAccept = async () => {
    if (status !== 'authenticated') {
      await login(window.location.href)
      return
    }

    setAccepting(true)
    setError('')

    try {
      await acceptInvitationByToken(token)
      setAccepted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось принять приглашение')
    } finally {
      setAccepting(false)
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Приглашение в организацию</h2>

      {loading && <p className="text-slate-600">Загружаем приглашение</p>}
      {error && <Alert tone="error">{error}</Alert>}
      {accepted && <Alert tone="success">Приглашение принято</Alert>}

      {!loading && invitation && (
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            <span className="font-medium">Статус:</span> {formatInvitationStatus(invitation.status)}
          </p>
          <p>
            <span className="font-medium">Срок действия:</span> {new Date(invitation.expiresAt).toLocaleString()}
          </p>
          <p>
            <span className="font-medium">Роли:</span> {invitation.roleCodes.length > 0
              ? invitation.roleCodes.map((roleCode) => formatRoleLabel(roleCode)).join(', ')
              : 'Нет'}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAccept}
              disabled={accepting || accepted || !invitation.canAccept}
              className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {accepted ? 'Принято' : accepting ? 'Принимаем приглашение' : 'Принять приглашение'}
            </button>
            <Link to="/" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
              На главную
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
