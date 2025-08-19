import { SupabaseClient, User } from '@supabase/supabase-js';

export async function syncProfile(client: SupabaseClient, user: User) {
  console.log("🔄 Iniciando syncProfile para usuario:", user.id);

  const { data, error } = await client
    .from('profiles')
    .select('phone, phone_prefix, first_name, second_name, last_name, second_last_name, country_code, role_id')
    .eq('id', user.id)
    .single();

  console.log("📊 Respuesta de profiles query en syncProfile:", { data, error });

  if (error || !data) {
    console.error("🚨 Error en syncProfile o no se encontró perfil:", error?.message);
    return;
  }

  const meta = user.user_metadata || {};
  const updates: Record<string, any> = {};

  if (!data.phone && meta.phone) updates.phone = meta.phone;
  if (!data.phone_prefix && meta.phone_prefix) updates.phone_prefix = meta.phone_prefix;
  if (!data.first_name && meta.first_name) updates.first_name = meta.first_name;
  if (!data.second_name && meta.second_name) updates.second_name = meta.second_name;
  if (!data.last_name && meta.last_name) updates.last_name = meta.last_name;
  if (!data.second_last_name && meta.second_last_name) updates.second_last_name = meta.second_last_name;
  if (!data.country_code && meta.country_code) updates.country_code = meta.country_code;

  if (!data.role_id && meta.role) {
    const { data: roleRow, error: roleError } = await client
      .from('roles')
      .select('id')
      .eq('code', meta.role)
      .single();
    console.log("📡 Respuesta de roles query:", { roleRow, roleError });
    if (roleRow) {
      updates.role_id = roleRow.id;
      console.log("✅ Asignando role_id:", roleRow.id);
    } else if (roleError) {
      console.error("🚨 Error al obtener role_id:", roleError.message);
    }
  }

  if (Object.keys(updates).length > 0) {
    console.log("🔄 Actualizando perfil con:", updates);
    const { error: updateError } = await client.from('profiles').update(updates).eq('id', user.id);
    if (updateError) {
      console.error("🚨 Error al actualizar perfil:", updateError.message);
    } else {
      console.log("✅ Perfil actualizado correctamente");
    }
  } else {
    console.log("ℹ️ No se requieren actualizaciones en el perfil");
  }
}