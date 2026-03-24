import axios from 'axios';

const API_BASE = '/api/v1';

export type Organization = {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'archived';
  owner_identity_id: string;
  created_at: string;
  updated_at: string;
};

export type BookingPolicy = {
  id: number;
  organization_id: string;
  max_booking_duration_min: number;
  booking_window_days: number;
  max_active_bookings_per_user: number;
  created_at: string;
  updated_at: string;
};

type AxiosConfig = {
  headers?: Record<string, string>;
};

export const apiRequest = axios.create({
  baseURL: API_BASE,
});

// Проверка здоровья сервиса
export async function getHealth() {
  return axios.get('/api/organizations/health');
}

// --- Организации ---

export async function createOrganization(token: string, payload: { name: string; description: string }) {
  return apiRequest.post<Organization>(
    '/organizations',
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

export async function getOrganization(token: string, orgId: string) {
  return apiRequest.get<Organization>(`/organizations/${orgId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateOrganization(
  token: string,
  orgId: string,
  payload: { name?: string; description?: string }
) {
  return apiRequest.put<Organization>(`/organizations/${orgId}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function deleteOrganization(token: string, orgId: string) {
  return apiRequest.delete(`/organizations/${orgId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function changeOrganizationOwner(
  token: string,
  orgId: string,
  newOwnerIdentityId: string
) {
  return apiRequest.put<Organization>(
    `/organizations/${orgId}/owner`,
    { new_owner_identity_id: newOwnerIdentityId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

// --- Политики бронирования ---

type RawBookingPolicy = {
  ID: number;
  OrganizationID: string;
  MaxBookingDurationMin: number;
  BookingWindowDays: number;
  MaxActiveBookingsPerUser: number;
  CreatedAt: string;
  UpdatedAt: string;
}

export async function getBookingPolicy(token: string, orgId: string) {
  const res = await apiRequest.get<RawBookingPolicy>(`/organizations/${orgId}/policy`, { headers: { Authorization: `Bearer ${token}` } });
  return {
    data: {
      id: res.data.ID,
      organization_id: res.data.OrganizationID,
      max_booking_duration_min: res.data.MaxBookingDurationMin,
      booking_window_days: res.data.BookingWindowDays,
      max_active_bookings_per_user: res.data.MaxActiveBookingsPerUser,
      created_at: res.data.CreatedAt,
      updated_at: res.data.UpdatedAt,
    } as BookingPolicy
  }
}

export async function updateBookingPolicy(
  token: string,
  orgId: string,
  payload: Partial<Omit<BookingPolicy, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>
) {
  return apiRequest.put<BookingPolicy>(`/organizations/${orgId}/policy`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAllOrganizations(token: string) {
  return apiRequest.get<Organization[]>('/organizations', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Получить деактивированные организации
export async function getDeactivatedOrganizations(token: string) {
  return apiRequest.get<Organization[]>('/organizations/deactivated', {
    headers: { Authorization: `Bearer ${token}` },
  });
}