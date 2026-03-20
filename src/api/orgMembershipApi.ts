import { apiRequest, apiRequestAnonymous } from './http';

export type UserProfile = {
  id: string;
  identityId: string;
  email: string;
  firstName: string;
  lastName: string;
  patronymic: string | null;
};

export type RegisterUserPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  patronymic: string | null;
};

export type RegisterUserResponse = {
  userId: string;
  identityId: string;
};

export type UserOrganizationsResponse = {
  organizations: Array<{
    organizationId: string;
    membershipId: string;
    status: 'Active' | 'Deactivated' | 'Removed';
    joinedAt: string | null;
    removedAt: string | null;
  }>;
};

export type AccessResponse = {
  organizationId: string;
  membershipStatus: string;
  roles: string[];
  permissions: string[];
};

export type OrganizationMember = {
  membershipId: string;
  userId: string;
  identityId: string;
  email: string;
  firstName: string;
  lastName: string;
  patronymic: string | null;
  status: string;
  department: string | null;
  title: string | null;
  joinedAt: string | null;
  removedAt: string | null;
  roles: string[];
};

export type OrganizationMembersResponse = {
  members: OrganizationMember[];
};

export type OrganizationRolesResponse = {
  roles: Array<{
    roleId: string;
    roleCode: string;
    name: string;
    description: string | null;
    priority: number;
    isSystem: boolean;
    permissionCodes: string[];
  }>;
};

export type PermissionsCatalogResponse = {
  permissions: Array<{
    code: string;
    name: string;
    description: string | null;
  }>;
};

export type OrganizationInvitationsResponse = {
  invitations: Array<{
    invitationId: string;
    status: string;
    expiresAt: string;
    createdAt: string;
    createdByUserId: string;
    acceptedByUserId: string | null;
    acceptedAt: string | null;
    revokedAt: string | null;
    roleCodes: string[];
  }>;
};

export type InvitationByToken = {
  invitationId: string;
  organizationId: string;
  status: string;
  expiresAt: string;
  canAccept: boolean;
  roleCodes: string[];
};

export type CreateInvitationResponse = {
  invitationId: string;
  invitationToken: string;
  expiresAt: string;
};

export async function registerUser(payload: RegisterUserPayload) {
  return apiRequestAnonymous<RegisterUserResponse>('/users/users/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMyProfile() {
  return apiRequest<UserProfile>('/users/users/me');
}

export async function getMyOrganizations(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiRequest<UserOrganizationsResponse>(
    `/users/users/me/organizations${query}`,
  );
}

export async function getMyAccess(organizationId: string) {
  return apiRequest<AccessResponse>(
    `/users/users/me/access?organizationId=${organizationId}`,
  );
}

export async function getOrganizationMembers(
  organizationId: string,
  status?: string,
) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiRequest<OrganizationMembersResponse>(
    `/users/organizations/${organizationId}/members${query}`,
  );
}

export async function getOrganizationMemberById(
  organizationId: string,
  membershipId: string,
) {
  return apiRequest<OrganizationMember>(
    `/users/organizations/${organizationId}/members/${membershipId}`,
  );
}

export async function getOrganizationRoles(
  organizationId: string,
  includeSystem = true,
) {
  return apiRequest<OrganizationRolesResponse>(
    `/users/organizations/${organizationId}/roles?includeSystem=${includeSystem}`,
  );
}

export async function getPermissionsCatalog(organizationId: string) {
  return apiRequest<PermissionsCatalogResponse>(
    `/users/organizations/${organizationId}/permissions`,
  );
}

export async function getOrganizationInvitations(
  organizationId: string,
  status?: string,
) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiRequest<OrganizationInvitationsResponse>(
    `/users/organizations/${organizationId}/invitations${query}`,
  );
}

export async function createCustomRole(
  organizationId: string,
  payload: {
    code: string;
    name: string;
    description: string | null;
    priority: number;
    permissionCodes: string[];
  },
) {
  return apiRequest(`/users/organizations/${organizationId}/roles/custom`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCustomRole(
  organizationId: string,
  roleId: string,
  payload: {
    code: string;
    name: string;
    description: string | null;
    permissionCodes: string[];
  },
) {
  return apiRequest(
    `/users/organizations/${organizationId}/roles/custom/${roleId}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  );
}

export async function deleteCustomRole(organizationId: string, roleId: string) {
  return apiRequest(
    `/users/organizations/${organizationId}/roles/custom/${roleId}`,
    {
      method: 'DELETE',
    },
  );
}

export async function assignMemberRoles(
  organizationId: string,
  membershipId: string,
  roleCodes: string[],
) {
  return apiRequest(
    `/users/organizations/${organizationId}/members/${membershipId}/roles`,
    {
      method: 'POST',
      body: JSON.stringify({ roleCodes }),
    },
  );
}

export async function revokeMemberRole(
  organizationId: string,
  membershipId: string,
  roleCode: string,
) {
  return apiRequest(
    `/users/organizations/${organizationId}/members/${membershipId}/roles/${encodeURIComponent(roleCode)}`,
    {
      method: 'DELETE',
    },
  );
}

export async function updateMember(
  organizationId: string,
  membershipId: string,
  payload: { department: string | null; title: string | null },
) {
  return apiRequest(
    `/users/organizations/${organizationId}/members/${membershipId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export async function deactivateMember(
  organizationId: string,
  membershipId: string,
) {
  return apiRequest(
    `/users/organizations/${organizationId}/members/${membershipId}/deactivate`,
    {
      method: 'POST',
    },
  );
}

export async function activateMember(
  organizationId: string,
  membershipId: string,
) {
  return apiRequest(
    `/users/organizations/${organizationId}/members/${membershipId}/activate`,
    {
      method: 'POST',
    },
  );
}

export async function removeMember(
  organizationId: string,
  membershipId: string,
) {
  return apiRequest(
    `/users/organizations/${organizationId}/members/${membershipId}`,
    {
      method: 'DELETE',
    },
  );
}

export async function createInvitation(
  organizationId: string,
  payload: { roleCodes: string[]; expiresAt: string },
) {
  return apiRequest<CreateInvitationResponse>(
    `/users/organizations/${organizationId}/invitations`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export async function revokeInvitation(
  organizationId: string,
  invitationId: string,
) {
  return apiRequest(
    `/users/organizations/${organizationId}/invitations/${invitationId}/revoke`,
    {
      method: 'POST',
    },
  );
}

export async function getInvitationByToken(token: string) {
  return apiRequestAnonymous<InvitationByToken>(
    `/users/invitations/${encodeURIComponent(token)}`,
  );
}

export async function acceptInvitationByToken(token: string) {
  return apiRequest(`/users/invitations/${encodeURIComponent(token)}/accept`, {
    method: 'POST',
  });
}
