const membershipStatusLabels: Record<string, string> = {
  Active: 'Активен',
  Deactivated: 'Деактивирован',
  Removed: 'Удалён',
}

const invitationStatusLabels: Record<string, string> = {
  Pending: 'Ожидает',
  Accepted: 'Принято',
  Revoked: 'Отозвано',
  Expired: 'Истекло',
}

export function formatMembershipStatus(status?: string | null) {
  if (!status) {
    return 'Неизвестно'
  }

  return membershipStatusLabels[status] ?? status
}

export function formatInvitationStatus(status?: string | null) {
  if (!status) {
    return 'Неизвестно'
  }

  return invitationStatusLabels[status] ?? status
}
