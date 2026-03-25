import { apiRequest } from './http';

export type BookingPolicySnapshot = {
  maxDurationHours: number;
  maxBookingsPerUser: number;
};

export type BookingItem = {
  id: string;
  resourceId: string;
  status: 'Active' | 'Cancelled';
};

export type BookingGroup = {
  id: string;
  identityId: string;
  organizationId: string;
  startTime: string;
  endTime: string;
  status: 'Active' | 'Cancelled';
  createdAt: string;
  bookings: BookingItem[];
  appliedPolicy: BookingPolicySnapshot;
};

export type AvailableResource = {
  id: string;
  name: string;
  type: string;
};

export type BusySlot = {
  startTime: string;
  endTime: string;
};

export type ResourceSchedule = {
  id: string;
  name: string;
  type: string;
  status: string;
  isAvailableForPeriod: boolean;
  busySlots: BusySlot[];
};

export type CreateBookingGroupPayload = {
  organizationId: string;
  resourceIds: string[];
  startTime: string;
  endTime: string;
};

const BOOKING_BASE = '/booking';

export async function getBookings(
  organizationId: string,
  params?: { from?: string; to?: string; status?: 'Active' | 'Cancelled' },
) {
  const query = new URLSearchParams({ organizationId });
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  if (params?.status) query.set('status', params.status);
  return apiRequest<BookingGroup[]>(`${BOOKING_BASE}/v1/Bookings?${query}`);
}

export async function getBookingById(id: string, organizationId: string) {
  return apiRequest<BookingGroup>(
    `${BOOKING_BASE}/v1/Bookings/${id}?organizationId=${organizationId}`,
  );
}

export async function createBooking(payload: CreateBookingGroupPayload) {
  return apiRequest<BookingGroup>(`${BOOKING_BASE}/v1/Bookings`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function cancelBooking(id: string, organizationId: string) {
  return apiRequest<void>(
    `${BOOKING_BASE}/v1/Bookings/${id}?organizationId=${organizationId}`,
    { method: 'DELETE' },
  );
}

export async function getAvailableResources(
  organizationId: string,
  from: string,
  to: string,
) {
  const query = new URLSearchParams({ organizationId, from, to });
  return apiRequest<AvailableResource[]>(
    `${BOOKING_BASE}/v1/resources/available?${query}`,
  );
}

export async function getBusySlots(
  resourceId: string,
  organizationId: string,
  from: string,
  to: string,
) {
  const query = new URLSearchParams({ organizationId, from, to });
  return apiRequest<BusySlot[]>(
    `${BOOKING_BASE}/v1/resources/${resourceId}/busy-slots?${query}`,
  );
}

export async function getResourcesSchedule(
  organizationId: string,
  from: string,
  to: string,
) {
  const query = new URLSearchParams({ organizationId, from, to });
  return apiRequest<ResourceSchedule[]>(
    `${BOOKING_BASE}/v1/resources/schedule?${query}`,
  );
}

export async function getMyBookings(
  organizationId: string,
  params?: { from?: string; to?: string; status?: 'Active' | 'Cancelled' },
) {
  const query = new URLSearchParams({ organizationId });
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  if (params?.status) query.set('status', params.status);
  return apiRequest<BookingGroup[]>(`${BOOKING_BASE}/v1/Bookings/my?${query}`);
}
