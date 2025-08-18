export type Role = 'usuario' | 'admin';

export interface Profile {
  id: string;
  email: string;
  phone?: string;
  first_name: string;
  second_name?: string;
  last_name: string;
  second_last_name: string;
  country_code: string;
  role_code: Role;
}
