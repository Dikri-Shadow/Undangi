# Undangi — Admin Guest & RSVP Management Architecture

Status: keputusan arsitektur final untuk MVP; customer exchange dan admin/customer recipient APIs sudah mulai diimplementasikan, sementara personal-link RSVP binding dan persistent rate limiting masih bertahap.

Dokumen ini adalah spesifikasi dan audit. Revisi ini tidak mengubah source code, migration, schema, fixture, database, dependency, atau deployment.

## 1. Keputusan bisnis final

1. Customer tidak memiliki akun/login atau dashboard.
2. Customer mendapatkan akses Guest Management melalui link khusus dengan customer access secret token.
2. Seluruh pengelolaan tamu dilakukan admin.
3. Admin dapat CRUD recipient dan generate personal invitation link untuk setiap recipient.
4. RSVP baru terhubung menggunakan `recipient_id`.
5. Admin memiliki dashboard statistik RSVP.
6. Admin menyiapkan laporan dan mengirimkannya secara manual melalui WhatsApp.
7. MVP tidak menggunakan WhatsApp API atau otomatisasi WhatsApp.

Customer access token kini merupakan bagian dari target Guest Management. Implementasi lama tidak dihapus; ia menjadi compatibility surface sampai flow baru selesai dan disetujui.

## 2. Arsitektur target MVP

```text
Admin login/session
        │
        ▼
Admin Guest Management UI/API
        │ CRUD recipient + generate/revoke personal link
        ▼
wedding_recipients ── personal invitation link ── public RSVP form
        │                                              │
        └──────────── wedding_rsvp.recipient_id ◄─────┘
                              │
                              ▼
                   Admin RSVP statistics/report
                              │
                              ▼
                    Manual report → WhatsApp
```

Tidak ada customer account, customer dashboard, atau WhatsApp API/background WhatsApp automation pada target MVP. Secure session cookie adalah kandidat mekanisme setelah token exchange, bukan keputusan final; session TTL masih terbuka.

## 3. Audit implementasi saat ini

### Sudah ada dan masih relevan

- `supabase/migrations/202611100004_guest_management_foundation.sql` sudah mendefinisikan `wedding_recipients`, `personal_token_hash`, `deleted_at`, kolom nullable `wedding_rsvp.recipient_id`, foreign key tenant `(wedding_slug, recipient_id)`, dan index terkait.
- `app/api/admin/weddings/[id]/guest-access/route.ts` serta route `regenerate` sudah menyediakan admin-only create/status/revoke/regenerate untuk customer guest-access lama.
- `services/admin-guest-access-service.ts` menghasilkan token 32-byte, menyimpan SHA-256 hash, memvalidasi `wedding_slug`, dan memakai RPC rotasi atomik.
- `app/api/customer/[slug]/recipients/route.ts` adalah API lama yang menerima `Authorization: Bearer`, menolak `?token=`, memvalidasi token server-side, dan hanya mengembalikan recipient aktif.
- Admin RSVP sudah tersedia melalui `app/admin/rsvp`, `app/admin/rsvp/[slug]`, `app/admin/invitations/[id]/rsvp`, `services/admin-rsvp-service.ts`, dan `components/admin/rsvp-results.tsx`.
- Dashboard existing sudah menghitung respons, hadir, dan jumlah tamu; ini dapat menjadi fondasi statistik target.
- `lib/admin-session.ts` adalah session cookie untuk admin dan tetap valid untuk admin. Ini bukan customer session.
- `lib/rate-limit.ts` memberi limiter process-local untuk RSVP publik/customer API lama; `lib/admin-rate-limit.ts` memiliki helper pemeriksaan limiter admin persisten.
- `components/guest-link-generator.tsx` dan `lib/guest-links.ts` masih menghasilkan legacy `/{slug}?to={name}`. Itu hanya personalisasi tampilan, bukan identity atau authorization.

### Belum sesuai dengan keputusan final

- Belum ditemukan admin CRUD API/UI untuk `wedding_recipients`.
- Belum ditemukan admin flow personal link per recipient.
- `app/api/wedding/rsvp/route.ts` saat ini menerima nama bebas dan belum mengikat RSVP baru ke verified `recipient_id`.
- `services/admin-rsvp-service.ts` belum memakai `recipient_id` untuk statistik per recipient.
- Customer access flow lengkap (bootstrap, exchange, secure session, dan Guest Management UI) belum ada.
- Belum ada personal invitation route yang mengikat link ke satu recipient.
- Belum ada laporan eksplisit per recipient termasuk “Belum Mengisi”.
- Belum ada integrasi atau otomasi WhatsApp; ini sesuai keputusan MVP.

## 4. Customer access token lama vs personal recipient token

| Aspek | Customer access token lama | Personal recipient token target |
|---|---|---|
| Scope | Satu wedding dan seluruh daftar recipient | Satu `recipient_id` pada satu wedding |
| Status MVP | Target akses Guest Management customer | Target link satu recipient |
| Penyimpanan | `wedding_guest_access.token_hash` | `wedding_recipients.personal_token_hash` |
| Endpoint lama | `GET /api/customer/{slug}/recipients` dengan Bearer | Public invitation/RSVP flow baru |
| Credential | Link khusus + customer secret token; exchange dapat menghasilkan secure session cookie | Personal link; tidak memberi akses seluruh daftar |
| Dampak kebocoran | Berpotensi membuka seluruh daftar recipient | Dibatasi satu recipient; tetap perlu revoke/regenerate |

Personal recipient token bukan customer account, customer access token, admin session, atau pengganti `recipient_id`. Customer token mengotorisasi Guest Management untuk satu wedding; personal token mengidentifikasi satu recipient. Keduanya harus memiliki hash, lifecycle, revoke, dan rate limit terpisah.

## 5. Customer access flow

```text
Admin authenticated
  │ create/rotate customer access
  ▼
Server: random token → hash only in database
  │ raw token shown once in admin response
  ▼
Admin hands link to customer
  ▼
Customer opens bootstrap link
  │ preferred: fragment #access=<token>; query parameter requires explicit risk approval
  ▼
Browser sends token once to HTTPS exchange endpoint
  ▼
Server validates hash + wedding scope + revocation state
  │ optional secure HttpOnly session cookie candidate
  ▼
Customer Guest Management API/UI
```

The customer is not registered as an account. The link is the possession factor. The exchange endpoint must not log the raw token, must return generic failures, and should use `Cache-Control: no-store`. If a cookie session is selected, it must be opaque, `HttpOnly`, `Secure` in HTTPS, narrowly scoped, and protected against CSRF; its TTL is intentionally not decided here.

### Fragment versus query parameter

- URL fragment (`#access=...`) is preferred for bootstrap because browsers do not send it in ordinary HTTP requests or Referer headers. Client code must exchange it immediately over HTTPS, call `history.replaceState`, and avoid localStorage/sessionStorage.
- Query parameters (`?token=...`) are discouraged because they can appear in server logs, analytics, browser history, Referer headers, and copied URLs. They may only be used if a separate threat review approves mitigations.
- A path token is also not automatically safe; access logs and browser history must be considered.

### Token exchange and session candidate

`POST /api/customer/{slug}/session/exchange` is the candidate exchange contract. It accepts the raw token only over HTTPS, validates the hash server-side, binds the result to `slug` and the active token version, and then either returns an authenticated response for each request or sets an opaque secure session cookie. The second option is a candidate, not a final decision.

Open decisions: session cookie versus per-request token proof, session TTL/idle TTL, absolute expiry, device/session limits, and whether the customer token itself expires. No session TTL must be assumed from this document.

## 6. Endpoint dan authorization

Semua mutation admin harus memakai pola existing `requireAdminApi()`, same-origin check, validasi input, dan authorization terhadap wedding. Semua query recipient/RSVP wajib tenant-scoped.

| Endpoint target | Authorization | Status |
|---|---|---|
| `GET /api/admin/weddings/{id}/recipients` | Admin session + wedding authorization | Belum diimplementasikan |
| `POST /api/admin/weddings/{id}/recipients` | Admin session + same-origin | Belum diimplementasikan |
| `PATCH/DELETE /api/admin/weddings/{id}/recipients/{recipientId}` | Admin session + composite tenant check | Belum diimplementasikan |
| `POST .../recipients/{recipientId}/link` | Admin session + same-origin | Belum diimplementasikan |
| `POST .../recipients/{recipientId}/link/regenerate` | Admin session + same-origin | Belum diimplementasikan |
| `GET /api/admin/weddings/{id}/rsvp` | Admin session + wedding authorization | Sebagian sudah ada |
| `GET /api/admin/weddings/{id}/rsvp/report` | Admin session + wedding authorization | Belum diimplementasikan |
| `POST /api/wedding/rsvp` | Public personal link + verified recipient context | Endpoint ada; binding belum ada |

Customer access candidates:

| Endpoint | Authorization | Status |
|---|---|---|
| `GET /{slug}/generate` | Public bootstrap; token preferably in fragment | Existing admin-generated URL contract; customer page/exchange incomplete |
| `POST /api/customer/{slug}/session/exchange` | Raw token in HTTPS body; server-side hash validation | Belum diimplementasikan |
| `DELETE /api/customer/{slug}/session` | Secure customer session, if selected | Belum diimplementasikan |
| `GET /api/customer/{slug}/recipients` | Existing Bearer token API; compatibility only | Implemented legacy route |

Raw personal token hanya boleh dikembalikan pada aksi generate/regenerate yang disengaja, idealnya sekali. Hash, token lama, dan secret tidak boleh masuk log, list response, atau status response.

## 7. Tenant isolation dan data rules

- Setiap read/write memakai composite scope `(wedding_slug, recipient_id)`; UUID saja bukan authorization boundary.
- Admin harus diotorisasi terhadap wedding sebelum mengakses recipient/RSVP.
- Public link harus memvalidasi token hash, wedding slug, recipient ID, `deleted_at IS NULL`, dan status wedding.
- Recipient wedding A tidak boleh dipakai untuk RSVP wedding B.
- Soft-delete menyembunyikan recipient dari daftar aktif/link baru tetapi mempertahankan history sesuai retention policy.
- RSVP legacy dengan `recipient_id IS NULL` dipertahankan dan tidak dipetakan otomatis berdasarkan nama.
- `vina-hendri` dan `qa-dummy-2` tidak boleh disentuh tanpa persetujuan eksplisit.
- Service-role Supabase tetap server-only; akses anon/authenticated langsung ke tabel sensitif tetap ditolak melalui RLS/grant.

## 8. Token lifecycle target

### Customer access token

1. Admin membuat customer access link.
2. Server menghasilkan token acak aman minimal 32 byte.
3. Database menyimpan hanya SHA-256 hash, token version, wedding scope, timestamps, dan revoke state.
4. Raw token hanya ditampilkan satu kali saat dibuat; admin menyerahkan link kepada customer.
5. Customer memakai fragment bootstrap lalu token exchange melalui HTTPS.
6. Server memvalidasi hash, wedding scope, active version, dan revoke state.
7. Admin dapat revoke atau rotate; token lama langsung tidak berlaku.

### Personal recipient token

1. Admin membuat/generate link untuk satu recipient.
2. Database menyimpan hanya hash pada `personal_token_hash`.
3. Link membuka invitation satu recipient dan RSVP memverifikasi context.
4. Regenerate mengganti token recipient tersebut tanpa memengaruhi customer access token.

Expiration/TTL customer token, personal token, dan optional secure session masih merupakan keputusan terbuka. Revoke/rotate wajib tersedia terlepas dari keputusan expiry.

Token tidak boleh dikirim ke log, error, analytics, referrer, atau URL yang tidak dirancang untuk secret. Format URL dan kebijakan expiry/revoke harus diputuskan sebelum implementasi.

## 9. Security controls: CSRF, XSS, dan rate limiting

Customer session candidate harus memakai CSRF protection untuk seluruh state-changing request: SameSite cookie policy, origin check, CSRF token/double-submit bila diperlukan, dan same-origin enforcement. Bearer token exchange harus memakai HTTPS, `Content-Type` yang tepat, generic errors, dan no-store headers.

XSS controls: render guest names/messages sebagai text, bukan unsanitized HTML; gunakan output encoding, CSP jika deployment mendukung, validasi server-side, dan jangan menaruh raw token di DOM setelah exchange. `history.replaceState` harus menghapus fragment. Jangan menulis token ke localStorage, sessionStorage, analytics, or console.

`lib/rate-limit.ts` saat ini process-local dan tidak cukup untuk enforcement konsisten multi-instance/serverless. Target MVP:

- Rate-limit public RSVP, personal-link resolution, generate/regenerate, dan bulk admin mutation.
- Gunakan mekanisme shared/persistent yang sudah didukung deployment; jangan menambah dependency atau migration dalam revisi ini.
- Key harus diprivacy-hash dan tidak memuat raw token dalam log.
- Sensitive operation fail closed bila limiter persisten tidak tersedia.
- Tetapkan angka limit, window, response `429`, dan observability sebelum coding.

## 10. RSVP, dashboard, dan WhatsApp

- RSVP personal wajib menyimpan `recipient_id` yang telah diverifikasi bersama `wedding_slug`.
- RSVP legacy dengan `recipient_id IS NULL` ditampilkan sebagai legacy/unmatched dan tidak di-auto-map.
- Dashboard target: total respons, hadir, tidak hadir, total tamu hadir, belum mengisi, dan daftar per recipient.
- Statistik harus tenant-scoped.
- Laporan dapat berupa tampilan admin, copy text, atau export file lokal.
- Admin mengirim laporan manual melalui WhatsApp.
- Tidak ada WhatsApp API, webhook, queue, cron, atau automated send pada MVP.

## 11. Threat model

| Threat | Control target | Status |
|---|---|---|
| Customer token bocor membuka seluruh recipient | Fragment bootstrap, hash-only storage, exchange, revoke/rotate, rate limit | Legacy Bearer route masih tersedia |
| Personal token brute force | 32-byte random, hash-only, generic errors, rate limit | Fondasi sebagian ada; flow belum ada |
| Token bocor di log/history/referrer | One-time controlled link, no raw-token logging | Belum diimplementasikan |
| Cross-wedding access | Composite tenant checks dan server-side lookup | Schema ada; runtime flow belum ada |
| Recipient enumeration | Generic response, opaque IDs, pagination, rate limit | Belum lengkap |
| Deleted recipient link reuse | `deleted_at IS NULL` saat resolution | Endpoint personal belum ada |
| RSVP memakai nama orang lain | Derive recipient dari verified link, jangan percaya `name` | Endpoint saat ini name-based |
| Unauthorized admin access | Admin session, wedding authorization, same-origin mutation | Pola existing ada |
| Multi-instance limiter bypass | Shared/persistent limiter | Belum selesai |
| WhatsApp data leakage/automation | Manual report only | Keputusan MVP |

Additional controls: CSRF protection for cookie-backed mutations, XSS-safe text rendering/CSP, no raw token in DOM/storage/logs, generic cross-tenant errors, and no-cache headers for token/session exchange.

## 12. Integration test matrix

### Admin and tenant isolation

- CRUD recipient hanya berhasil untuk admin dan wedding yang diizinkan.
- Cross-wedding ID/slug, invalid session, invalid origin, malformed UUID, dan invalid payload ditolak.
- `vina-hendri` dan `qa-dummy-2` tidak dimutasi oleh test/fixture.

### Personal link and token

- Generate hanya menyimpan hash; raw token tidak dilog.
- Token valid membuka recipient yang benar saja.
- Invalid, revoked, deleted, malformed, dan cross-wedding token ditolak generik.
- Regenerate menonaktifkan link lama tanpa mengubah recipient lain.

### Customer access flow

- Admin create mengembalikan link dan raw token hanya sekali; database/status response tidak memuat raw token atau hash.
- Fragment bootstrap mengirim token melalui HTTPS exchange, menghapus fragment dengan `history.replaceState`, dan tidak mengirim token pada Referer.
- Query-token flow ditolak atau hanya berjalan bila mitigasi yang disetujui tersedia.
- Exchange invalid, malformed, revoked, rotated, expired-if-policy-added, dan cross-wedding token ditolak generik.
- Customer hanya dapat membaca/mengelola recipient pada wedding yang terikat token.
- Revoke memutus akses aktif; rotate memutus versi lama.
- Bila cookie dipilih: cookie opaque, HttpOnly, Secure, SameSite sesuai keputusan, TTL yang dikonfigurasi, CSRF tests, logout/clear, dan session invalidation.
- XSS payload pada guest name/message tidak menjadi executable markup; token tidak muncul di DOM, storage, console, log, atau analytics.
- Rate limit exchange dan mutation menghasilkan `429` serta konsisten lintas instance.

### RSVP and reporting

- RSVP personal menyimpan `recipient_id` benar.
- Recipient A tidak dapat mengirim RSVP untuk B atau wedding lain.
- Legacy RSVP tetap terbaca sebagai unmatched.
- Statistik dan “Belum Mengisi” konsisten per wedding.
- Duplicate submission dan batas jumlah tamu mengikuti validasi existing.

### Security and regression

- Token/hash tidak ada di URL/log/error/list response/browser storage yang tidak perlu.
- Public/admin limits menghasilkan `429` dan tetap berlaku lintas instance.
- RLS/grant menolak direct anon/authenticated access ke tabel sensitif.
- Legacy `?to=` hanya mempersonalisasi tampilan.
- Manual report tidak mengaktifkan WhatsApp API/automation.

## 13. Urutan implementasi bertahap

1. Putuskan token expiry, session cookie versus per-request proof, session TTL/idle TTL, device policy, dan status wedding yang boleh diakses.
2. Kunci fragment URL, exchange contract, CSRF/XSS controls, raw-token exposure policy, dan generic error policy.
3. Audit data recipient/RSVP existing tanpa menyentuh wedding terlindungi.
4. Bangun admin customer-link create/revoke/rotate dengan hash-only storage.
5. Implementasikan bootstrap/exchange dan secure session hanya jika opsi cookie disetujui.
6. Bangun customer Guest Management UI/API dengan tenant authorization dan rate limit.
7. Bangun admin recipient list/CRUD dan personal recipient links.
8. Integrasikan RSVP dengan verified `recipient_id`; pertahankan legacy tanpa auto-mapping.
9. Tambahkan statistik, manual report/export, dan pengiriman WhatsApp manual.
10. Tambahkan integration, security, tenant-isolation, CSRF, XSS, dan regression tests.
11. Tinjau ulang compatibility route lama sebelum deprecation/removal; jangan menghapus tanpa persetujuan eksplisit.

## 14. Fitur yang belum diimplementasikan

- [ ] Admin recipient CRUD UI/API.
- [ ] Generate/revoke/regenerate personal invitation link.
- [ ] Personal invitation route dan secure token resolution.
- [ ] RSVP submission dengan verified `recipient_id`.
- [ ] Statistik per recipient dan “Belum Mengisi”.
- [ ] Manual report/export.
- [ ] Shared/persistent rate limiting untuk personal flow.
- [ ] Integration/security/tenant-isolation tests untuk flow baru.
- [ ] Deprecation plan customer access token API lama.
- [ ] Kontrak expiry/retention/cleanup token personal.
- [ ] Final decision untuk session cookie versus per-request token proof.
- [ ] Final decision untuk customer token expiry dan session TTL/idle TTL.
- [ ] CSRF/XSS integration tests dan secure exchange route.

## 15. Tidak dikerjakan dalam revisi ini

- Tidak menghapus customer access token API lama.
- Tidak mengubah source code, migration, schema, fixture, dependency, database, atau production.
- Tidak membuat customer account, dashboard, source-code customer flow, migration, session cookie implementation, WhatsApp API, atau automation.
- Tidak melakukan backfill RSVP lama berdasarkan nama.
- Tidak menjalankan migration, seed, database write, commit, push, atau deploy.
