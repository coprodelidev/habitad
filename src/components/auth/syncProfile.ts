import { SupabaseClient, User } from '@supabase/supabase-js';

export async function syncProfile(client: SupabaseClient, user: User) {
  const { data, error } = await client
    .from('profiles')
    .select('phone, first_name, second_name, last_name, second_last_name, country_code, role_code')
    .eq('id', user.id)
    .single();

  if (error || !data) return;

  const meta = user.user_metadata || {};
  const updates: Record<string, any> = {};

  if (!data.phone && meta.phone) updates.phone = meta.phone;
  if (!data.first_name && meta.first_name) updates.first_name = meta.first_name;
  if (!data.second_name && meta.second_name) updates.second_name = meta.second_name;
  if (!data.last_name && meta.last_name1) updates.last_name = meta.last_name1;
  if (!data.second_last_name && meta.last_name2) updates.second_last_name = meta.last_name2;
  if (!data.country_code && meta.country_code) updates.country_code = meta.country_code;
  if (!data.role_code && meta.role) updates.role_code = meta.role;

  if (Object.keys(updates).length > 0) {
    await client.from('profiles').update(updates).eq('id', user.id);
  }
}
