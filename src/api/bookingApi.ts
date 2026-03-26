import { apiRequest } from './http';

export type BookingItem = {
  id: string;
  resourceId: string;
  status: 'Active' | 'Cancelled';
};

export type BookingPolicySnapshot = {
  maxDurationHours: number;
  maxBookingsPerUser: number;
};

export type BookingGroup = {
  id: string;
  identityId: string;
  organizationId: string;
  startTime: string;      // UTC от сервера
  endTime: string;        // UTC от сервера
  startTimeLocal: Date;   // локальное время
  endTimeLocal: Date;     // локальное время
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
  startTimeLocal: Date;
  endTimeLocal: Date;
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

function convertBookingToLocal(b: BookingGroup): BookingGroup {
  return {
    ...b,
    startTimeLocal: new Date(b.startTime),
    endTimeLocal: new Date(b.endTime),
    bookings: b.bookings,
  };
}

function convertBusySlotToLocal(slot: BusySlot): BusySlot {
  return {
    ...slot,
    startTimeLocal: new Date(slot.startTime),
    endTimeLocal: new Date(slot.endTime),
  };
}

export async function getBookings(
    organizationId: string,
    params?: { from?: string; to?: string; status?: 'Active' | 'Cancelled' },
) {
  const query = new URLSearchParams({ organizationId });
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  if (params?.status) query.set('status', params.status);

  const bookings = await apiRequest<BookingGroup[]>(
      `${BOOKING_BASE}/v1/Bookings?${query}`
  );

  return bookings.map(convertBookingToLocal);
}

export async function getBookingById(id: string, organizationId: string) {
  const booking = await apiRequest<BookingGroup>(
      `${BOOKING_BASE}/v1/Bookings/${id}?organizationId=${organizationId}`
  );

  return convertBookingToLocal(booking);
}

export async function createBooking(payload: {
  organizationId: string
  resourceIds: string[]
  startTime: Date
  endTime: Date
}) {
  // конвертируем Date -> UTC ISO перед отправкой на сервер
  const body = {
    ...payload,
    startTime: payload.startTime.toISOString(),
    endTime: payload.endTime.toISOString(),
  }

  return apiRequest<BookingGroup>(`${BOOKING_BASE}/v1/Bookings`, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then(convertBookingToLocal)
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
  const slots = await apiRequest<BusySlot[]>(
      `${BOOKING_BASE}/v1/resources/${resourceId}/busy-slots?${query}`,
  );

  return slots.map(convertBusySlotToLocal);
}

export async function getResourcesSchedule(
    organizationId: string,
    from: string,
    to: string,
) {
  const query = new URLSearchParams({ organizationId, from, to });
  const schedules = await apiRequest<ResourceSchedule[]>(
      `${BOOKING_BASE}/v1/resources/schedule?${query}`,
  );

  return schedules.map(s => ({
    ...s,
    busySlots: s.busySlots.map(convertBusySlotToLocal),
  }));
}

export async function getMyBookings(
    organizationId: string,
    params?: { from?: string; to?: string; status?: 'Active' | 'Cancelled' },
) {
  const query = new URLSearchParams({ organizationId });
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  if (params?.status) query.set('status', params.status);

  const bookings = await apiRequest<BookingGroup[]>(
      `${BOOKING_BASE}/v1/Bookings/my?${query}`
  );

  return bookings.map(convertBookingToLocal);
}