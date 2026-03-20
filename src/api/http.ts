import keycloak from '../keycloak'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

type ErrorPayload = {
  description?: string
  errors?: Record<string, string[]>
}

function fallbackMessageByStatus(status: number) {
  switch (status) {
    case 400:
      return 'Некорректный запрос'
    case 401:
      return 'Требуется авторизация'
    case 403:
      return 'Недостаточно прав для выполнения действия'
    case 404:
      return 'Запрошенные данные не найдены'
    case 409:
      return 'Конфликт данных'
    case 422:
      return 'Ошибка валидации данных'
    case 500:
      return 'Внутренняя ошибка сервера'
    default:
      return 'Произошла ошибка при выполнении запроса'
  }
}

async function parseApiError(response: Response) {
  let message = response.statusText || fallbackMessageByStatus(response.status)

  try {
    const errorPayload = (await response.json()) as ErrorPayload
    const description = typeof errorPayload.description === 'string' ? errorPayload.description : undefined
    const details = errorPayload.errors
      ? Object.entries(errorPayload.errors)
          .flatMap(([field, messages]) => messages.map((fieldMessage) => `${field}: ${fieldMessage}`))
          .join('\n')
      : ''

    message = description ?? message

    if (details) {
      message = `${message}\n${details}`
    }
  } catch {
    // ignore parsing errors and use status text
  }

  if (
    !message ||
    message === 'Not Found' ||
    message === 'Forbidden' ||
    message === 'Unauthorized' ||
    message === 'Bad Request' ||
    message === 'Conflict' ||
    message === 'Internal Server Error'
  ) {
    message = fallbackMessageByStatus(response.status)
  }

  return new ApiError(response.status, message)
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (!keycloak.authenticated) {
    throw new ApiError(401, 'Пользователь не авторизован')
  }

  await keycloak.updateToken(30)

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${keycloak.token}`,
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw await parseApiError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    return undefined as T
  }

  return (await response.json()) as T
}

export async function apiRequestAnonymous<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw await parseApiError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
