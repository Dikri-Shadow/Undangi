const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const emailArg = process.argv.find((value) => value.startsWith("--email="))?.slice(8).trim().toLowerCase();
if (!url || !key) throw new Error("Supabase server environment wajib tersedia.");
if (!emailArg) throw new Error("Gunakan --email=alamat-admin yang telah diverifikasi.");
const usersResponse = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=1000`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
if (!usersResponse.ok) throw new Error("Daftar Auth user tidak dapat dibaca.");
const payload = await usersResponse.json() as { users?: Array<{ id: string; email?: string }> };
const matches = (payload.users || []).filter((user) => user.email?.toLowerCase() === emailArg);
if (matches.length !== 1) throw new Error("Harus ditemukan tepat satu Auth user dengan email tersebut.");
const response = await fetch(`${url}/rest/v1/app_admin`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ singleton_key: 1, auth_user_id: matches[0].id, email: emailArg }) });
if (!response.ok) throw new Error(response.status === 409 ? "Singleton admin sudah diklaim." : `Claim gagal (${response.status}).`);
console.log("Existing Auth user berhasil diklaim sebagai single admin.");

export {};
