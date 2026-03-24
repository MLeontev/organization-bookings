import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Alert } from '../../../components/Alert'
import keycloak from '../../../keycloak'
import { createOrganization, type Organization } from '../../../api/organizationsApi'

export function CreateOrganizationPage() {
  const navigate = useNavigate()
  const [token, setToken] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Берём токен Keycloak
  useEffect(() => {
    if (keycloak.token) {
      console.log('Keycloak token:', keycloak.token) // для отладки
      setToken(keycloak.token)
    }
  }, [keycloak.token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      setError('Токен не получен')
      return
    }

    setLoading(true)
    setError('')
    try {
      const org: Organization = await createOrganization(token, { name, description }).then(res => res.data)
      navigate(`/organizations/${org.id}`) // переходим на страницу организации после создания
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать организацию')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/" className="text-sm font-medium text-sky-700 hover:underline">
        ← Назад на главную
      </Link>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm max-w-lg">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Создать организацию</h2>

        {error && (
          <Alert tone="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Название</label>
                <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Описание</label>
                <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-sky-600 px-4 py-2 text-white text-sm font-medium hover:bg-sky-700 transition disabled:opacity-50"
            >
                {loading ? 'Создаём...' : 'Создать'}
            </button>
        </form>
      </section>
    </div>
  )
}