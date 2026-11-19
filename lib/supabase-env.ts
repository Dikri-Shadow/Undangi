export function getSupabasePublicEnv() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey ? { url: url.replace(/\/$/, ""), anonKey } : null;
}

export function getSupabaseAdminEnv() {
  const publicEnv = getSupabasePublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return publicEnv && serviceRoleKey ? { ...publicEnv, serviceRoleKey } : null;
}

export class CmsUnavailableError extends Error {
  constructor() { super("CMS Supabase belum dikonfigurasi."); }
}
