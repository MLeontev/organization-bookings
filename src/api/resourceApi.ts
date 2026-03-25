import { apiRequest } from './http'

export type ResourceType = 'meeting_room' | 'workplace' | 'equipment' | 'office'
export type ResourceStatus = 'available' | 'temporarily_unavailable' | 'out_of_service'

export type BookingRules = {
  maxDurationHours: number
  allowedRoles: string[]
}

export type ResourceItem = {
  id: string
  organizationId: string
  name: string
  type: ResourceType
  status: ResourceStatus
  officeAddress: string | null
  floor: number | null
  description: string | null
  bookingRules: BookingRules
}

export type CreateResourcePayload = {
  organizationId: string
  name: string
  type: ResourceType
  status: ResourceStatus
  officeAddress: string | null
  floor: number | null
  description: string | null
  bookingRules: BookingRules
}

export type UpdateResourcePayload = {
  name: string
  type: ResourceType
  officeAddress: string | null
  floor: number | null
  description: string | null
  bookingRules?: BookingRules
}

export async function getResources(organizationId: string, status?: ResourceStatus) {
  const query = new URLSearchParams({ organizationId })
  if (status) {
    query.set('status', status)
  }

  return apiRequest<ResourceItem[]>(`/resources/api/resources?${query.toString()}`)
}

export async function createResource(payload: CreateResourcePayload) {
  return apiRequest<ResourceItem>('/resources/api/resources', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateResource(resourceId: string, payload: UpdateResourcePayload) {
  return apiRequest<ResourceItem>(`/resources/api/resources/${resourceId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function updateResourceStatus(resourceId: string, status: ResourceStatus) {
  return apiRequest<ResourceItem>(`/resources/api/resources/${resourceId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function deleteResource(resourceId: string) {
  return apiRequest<void>(`/resources/api/resources/${resourceId}`, {
    method: 'DELETE',
  })
}
