/**
 * Rol de un usuario.
 *
 * El backend expone el rol en **dos formatos** por razones históricas: el login
 * devuelve minúscula (`"admin"`) y `UserDto` devuelve Title Case (`"Admin"`). La
 * decisión de no unificarlos está tomada — la web depende de ambos — así que lo que
 * corresponde es tener el mapeo en un solo sitio en vez de comparar literales sueltos
 * repartidos por las páginas.
 */
export type Role = 'Admin' | 'Technician' | 'Client';

/** Formato que espera el backend al crear o filtrar usuarios. */
export type RoleApiValue = 'ADMIN' | 'TECHNICIAN' | 'CLIENT';

export function roleToApi(role: Role): RoleApiValue {
  return role.toUpperCase() as RoleApiValue;
}

export function isClient(role: Role | string | undefined): boolean {
  return role?.toLowerCase() === 'client';
}

export function isTechnician(role: Role | string | undefined): boolean {
  return role?.toLowerCase() === 'technician';
}
