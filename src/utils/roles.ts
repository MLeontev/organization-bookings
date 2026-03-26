type RoleLike = {
  roleCode: string;
  name: string;
};

const defaultRoleLabels: Record<string, string> = {
  ORG_OWNER: 'Владелец организации',
  ORG_ADMIN: 'Администратор организации',
  RESOURCE_ADMIN: 'Администратор ресурсов',
  EMPLOYEE: 'Сотрудник',
  VIEWER: 'Наблюдатель',
};

export function formatRoleLabel(roleCode: string, roles?: RoleLike[]) {
  if (!roleCode) {
    return 'Неизвестная роль';
  }

  const normalizedCode = roleCode.trim();
  const normalizedCodeUpper = normalizedCode.toUpperCase();

  if (roles && roles.length > 0) {
    const role = roles.find(
      (item) => item.roleCode.toUpperCase() === normalizedCodeUpper,
    );
    if (role?.name) {
      return role.name;
    }
  }

  return defaultRoleLabels[normalizedCodeUpper] ?? normalizedCode;
}
