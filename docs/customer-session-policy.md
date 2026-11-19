# Kebijakan Sesi Customer — Keputusan Final (Tahap 4 + 5)

Dokumen ini mencatat keputusan final untuk sesi customer dan recipient
Undangi. Implementasi ada di `lib/customer-session.ts`,
`app/api/customer/[slug]/session/route.ts`,
`app/api/wedding/rsvp/session/route.ts`, dan
`services/adapters/supabase-admin-adapter.ts`.

## TTL

- **TTL absolut: 7 hari** (`CUSTOMER_ABSOLUTE_TTL = 7 * 24 * 60 * 60` detik).
  Berlaku untuk sesi customer (`undangi_customer_session`) dan sesi
  recipient (`undangi_recipient_session`); keduanya memakai konstanta yang
  sama, bukan literal terpisah.
- **Idle: 24 jam** (`CUSTOMER_IDLE_TTL = 24 * 60 * 60` detik). Sesi yang
  tidak dipakai selama 24 jam ditolak saat dibuka (`openCustomerSession` /
  `openRecipientSession`).

## Cookie

- `httpOnly: true`
- `secure: true` di production (`NODE_ENV === "production"`)
- `sameSite: "lax"`
- `path: "/"`
- `maxAge: CUSTOMER_ABSOLUTE_TTL` (7 hari)

## Device limit

- **Maks 3 sesi aktif per subject** (default; ubah via env
  `CUSTOMER_SESSION_DEVICE_LIMIT`).
- Subject adalah pasangan `(wedding_slug, subject_type, subject_id)`:
  `subject_type` `customer` dengan `subject_id = wedding_slug`, atau
  `subject_type` `recipient` dengan `subject_id = recipientId`.
- **Eviksi tertua**: bila jumlah sesi aktif sudah mencapai limit, sesi
  dengan `last_seen_at` paling lama di-revoke sebelum sesi baru didaftarkan
  (`enforceCustomerSessionLimit` + `selectCustomerSessionsToEvict`).
- `device_hash` = SHA-256 (64 hex) dari header `User-Agent`.
- Penyimpanan: tabel `customer_sessions` (migrasi
  `supabase/migrations/202611180002_customer_sessions.sql`, RLS
  service-role-only).
- **Fail-open sementara**: selama tabel belum diterapkan di Supabase live,
  enforcement dan registrasi hanya `console.warn` lalu melanjutkan exchange
  — sesi tetap dibuat. Setelah migrasi diterapkan, enforcement aktif penuh.

## Rotasi token

- Token tidak dirotasi otomatis di dalam cookie. Rotasi dilakukan lewat
  **re-exchange**: customer/recipient menukar token aksesnya lagi di
  endpoint exchange (`POST /api/customer/[slug]/session` atau
  `POST /api/wedding/rsvp/session`), yang menerbitkan cookie sesi baru.
- Token personal recipient dapat dirotasi admin lewat
  `PATCH /api/admin/weddings/[id]/recipients` (`rotateToken: true`); token
  personal owner dapat di-revoke lalu dibuat ulang lewat
  `/api/admin/weddings/[id]/customer-access`.

## Token customer legacy (terdepresiasi)

- Token wedding-wide lama (tabel `wedding_guest_access`, satu token
  mencakup semua recipient) **terdepresiasi** dan digantikan token personal
  owner (tabel `wedding_customer_access`, migrasi
  `supabase/migrations/202611180001_customer_personal_access.sql`).
- Urutan validasi di exchange customer: token personal-owner dulu, lalu
  legacy. Keduanya gagal → 401.
- Penonaktifan: set env `LEGACY_CUSTOMER_TOKEN_ENABLED=false` — setelah
  itu `validateCustomerToken` selalu mengembalikan `false`.
- **Butuh persetujuan Zeke** sebelum penonaktifan: pastikan (1) kedua
  migrasi (`202611180001`, `202611180002`) sudah diterapkan ke Supabase
  live, dan (2) setiap wedding yang masih memakai link customer lama sudah
  mendapat token personal-owner baru. Sampai saat itu, legacy tetap hidup
  dan setiap pemakaiannya mencatat satu `console.warn` depresiasi per proses.
