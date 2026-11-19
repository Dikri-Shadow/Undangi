# Undangi AI Developer Team Workflow

## Peran

- **backend**: arsitektur backend, route API, Supabase, query, auth, RLS, tenant isolation, token security, dan validasi server.
- **frontend**: UI/UX, React/Next.js sesuai stack aktual, dashboard admin, customer pages, responsive layout, form, interaksi, dan integrasi API yang sudah tersedia.
- **qa**: type checks, ESLint, unit/integration test, browser/Playwright bila sudah tersedia atau disetujui, regresi, dan bukti pengujian.
- **reviewer**: review kode dan keamanan independen; read-only, tanpa mengedit source atau database.

Satu agent utama bertindak sebagai koordinator: membagi scope, menjaga kontrak antarbagian, menghindari konflik file, menggabungkan laporan, dan meminta persetujuan sebelum tindakan yang dilarang.

## Delegasi dan pekerjaan paralel

Delegasikan tugas dengan tujuan, file/folder yang boleh disentuh, batasan, kriteria selesai, dan perintah verifikasi. Backend dan frontend boleh paralel hanya bila file tidak bertabrakan. Jika kontrak API atau schema perlu berubah, hentikan koordinasi dan minta persetujuan eksplisit.

## Git dan worktree

Semua pekerjaan tetap lokal. Periksa `git status --short` sebelum membuat worktree atau perubahan. Worktree boleh dipakai untuk pekerjaan independen setelah audit status selesai; jangan commit, push, deploy, reset database, menjalankan migration, menghapus data, atau memasang dependency tanpa persetujuan eksplisit. Jangan menimpa perubahan lokal yang sudah ada.

## Alur review dan pengujian

1. Koordinator menetapkan scope dan risiko.
2. Agent pelaksana mengubah file dalam scope dan melaporkan file, alasan, serta verifikasi.
3. QA menjalankan pemeriksaan yang tersedia dari `package.json` dan melaporkan command, output, fixture, serta bukti; QA tidak menyatakan PASS tanpa bukti.
4. Reviewer memeriksa diff dan hasil QA secara independen dalam mode read-only.
5. Koordinator menyelesaikan temuan, mengulang QA/review yang relevan, lalu meminta persetujuan pengguna untuk tindakan Git atau production.

## Format laporan akhir

```text
Status: DONE | BLOCKED | NEEDS_APPROVAL
Ringkasan:
File berubah:
- path — alasan
Verifikasi:
- command — hasil/bukti
Temuan QA/reviewer:
- severity — path — detail
Risiko atau persetujuan yang dibutuhkan:
```
