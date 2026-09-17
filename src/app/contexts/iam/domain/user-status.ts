/** Estado de la cuenta. `pending` = registro público a la espera de que un admin lo active. */
export type UserStatus = 'active' | 'inactive' | 'pending';

export function isPendingApproval(status: UserStatus | string | undefined): boolean {
  return status === 'pending';
}
