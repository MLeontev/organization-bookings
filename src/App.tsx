import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { useAuth } from './auth/useAuth'
import { DashboardPage } from './pages/DashboardPage'
import { InvitationPage } from './pages/InvitationPage'
import { OrganizationPage } from './pages/OrganizationPage'
import { CreateOrganizationPage } from './pages/organization/components/CreateOrganization.tsx'
import { RegisterPage } from './pages/RegisterPage'
import {BookingsPage} from "./pages/bookings/BookingsPage.tsx";
import {AvailableResourcesPage} from "./pages/bookings/AvailableResourcesPage.tsx";
import {MyBookingsPage} from "./pages/bookings/MyBookingsPage.tsx";
import {BookingDetailPage} from "./pages/bookings/BookingDetailPage.tsx";

function LoadingScreen() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Панель управления</h1>
      <p className="mt-2 text-slate-600">Проверяем вход</p>
    </div>
  )
}

function LoginScreen() {
  const { login } = useAuth()

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Панель управления</h1>
      <p className="mt-2 text-slate-600">Войдите через Keycloak чтобы продолжить</p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => {
            void login(window.location.href)
          }}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white"
        >
          Войти
        </button>
        <Link to="/register" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
          Зарегистрироваться
        </Link>
      </div>
    </div>
  )
}

function AppLayout() {
  const { status, username, logout } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <LoadingScreen />
  }

  const canOpenWithoutAuth = location.pathname.startsWith('/invite/') || location.pathname === '/register'

  if (status === 'unauthenticated' && !canOpenWithoutAuth) {
    return <LoginScreen />
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-8">
      <header className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Кабинет организации</h1>
            <p className="text-sm text-slate-600">Участники, роли и приглашения</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{username ? `Пользователь: ${username}` : 'Гость'}</span>
            {status === 'authenticated' && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                        to="/organization/create"
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
                    >
                        Создать организацию
                    </Link>
                    <Link
                        to="/bookings"
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
                    >
                        Мои бронирования
                    </Link>
                    <button
                        type="button"
                        onClick={() => {
                            void logout()
                        }}
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
                    >
                        Выйти
                    </button>
                </div>
            )}
          </div>
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={status === 'authenticated' ? <DashboardPage /> : <LoginScreen />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/organizations/:organizationId"
            element={status === 'authenticated' ? <OrganizationPage /> : <LoginScreen />}
          />
          <Route
            path="/organizations/:organizationId/bookings"
            element={status === 'authenticated' ? <BookingsPage /> : <LoginScreen />}
          />
          <Route
              path="organizations/:organizationId/bookings/new"
              element={status === 'authenticated' ? <AvailableResourcesPage /> : <LoginScreen />}
          />
          <Route path="/bookings" element={status === 'authenticated' ? <MyBookingsPage /> : <LoginScreen />} />
          <Route
              path="/organizations/:organizationId/bookings/:bookingId"
              element={status === 'authenticated' ? <BookingDetailPage /> : <LoginScreen />}
          />
          <Route path="/invite/:token" element={<InvitationPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route
            path="/organization/create"
            element={status === 'authenticated' ? <CreateOrganizationPage /> : <LoginScreen />}
          />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
