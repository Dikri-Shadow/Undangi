import { AdminPage } from "@/components/admin/admin-shell";
import { TrashList } from "@/components/admin/trash-list";
import { supabaseCmsAdapter } from "@/services/adapters/supabase-cms-adapter";
export default async function TrashPage() { const result = await supabaseCmsAdapter.listTrash().then((rows) => ({ rows, failed: false })).catch(() => ({ rows: [], failed: true })); return <AdminPage title="Sampah" description="Pulihkan undangan yang dihapus sementara. Hapus permanen belum tersedia.">{result.failed && <p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Sampah belum dapat dimuat. Muat ulang halaman untuk mencoba lagi.</p>}<TrashList rows={result.rows} /></AdminPage>; }
