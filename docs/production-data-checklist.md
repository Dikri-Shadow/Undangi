# Production data checklist

Seluruh konten publik diganti melalui `data/wedding-config.ts`. Penanda `TODO_REAL_DATA` dan `dataStatus.required` menjadi daftar tunggal data yang belum final.

## Foto

- `assets.cover` / `assets.hero`: portrait 1440×1920 atau lebih besar, WebP/AVIF, target 250–500 KB.
- `assets.groomProfile` / `assets.brideProfile`: portrait 1200×1600, target 150–350 KB.
- `assets.divider` / `assets.closing`: landscape atau portrait sesuai crop, target 200–450 KB.
- `gallery`: ekspor tiap foto sesuai rasio tampilannya; hindari file kamera mentah 5–15 MB.
- `assets.ogImage`: 1200×630, target di bawah 500 KB.

Komponen sudah menyediakan `sizes`, lazy loading untuk galeri, prioritas untuk visual awal, serta rasio stabil. Pertahankan dimensi/crop saat mengganti path agar CLS tidak berubah.

## Audio

Letakkan audio berlisensi di `public/audio/wedding-theme.mp3`, lalu ubah `music.enabled` menjadi `true`. Player baru meminta audio setelah undangan dibuka, mendukung loop dari config, dan berhenti menampilkan kontrol bila berkas gagal dimuat.

## Backend

1. Jalankan migration di `supabase/migrations/` pada project Supabase target.
2. Isi env berdasarkan `.env.example`.
3. Set `NEXT_PUBLIC_WEDDING_DATA_ADAPTER=supabase`.
4. Simpan `SUPABASE_SERVICE_ROLE_KEY` hanya di environment server/hosting.

## Metadata

Production base URL berasal dari `NEXT_PUBLIC_SITE_URL` dengan fallback resmi `https://undangi.my.id`. Ganti `assets.ogImage` setelah foto sosial final tersedia.
