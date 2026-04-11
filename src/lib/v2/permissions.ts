export type RoleCode =
  | 'administrador'
  | 'gerente'
  | 'coordinador'
  | 'supervisor'
  | 'asistente'
  | 'promotor'
  | 'auditor'
  | 'cliente'
  | 'usuario'
  | 'interesado';

export const STAFF_ROLES: RoleCode[] = [
  'administrador',
  'gerente',
  'coordinador',
  'supervisor',
  'asistente',
  'promotor',
];

export const ADMIN_ROLES: RoleCode[] = ['administrador', 'gerente'];

export function isAdmin(role?: string | null): boolean {
  return !!role && (ADMIN_ROLES as string[]).includes(role);
}

export function isStaff(role?: string | null): boolean {
  return !!role && (STAFF_ROLES as string[]).includes(role);
}

export function isAuditor(role?: string | null): boolean {
  return role === 'auditor';
}

export function isCliente(role?: string | null): boolean {
  return role === 'cliente';
}

export function canWriteProperty(role?: string | null): boolean {
  return isAdmin(role);
}

export function canRegisterPayment(role?: string | null): boolean {
  return isStaff(role);
}

export function canDeletePayment(role?: string | null): boolean {
  return isAdmin(role);
}

export function canManageUsers(role?: string | null): boolean {
  return isAdmin(role);
}
