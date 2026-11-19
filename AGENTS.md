# Undangi — Agent Instructions

Undangi adalah aplikasi SaaS undangan pernikahan digital. Model bisnis awal adalah admin-assisted, dengan target pasangan serta reseller/WO. Pembayaran manual dilakukan melalui transfer bank atau QRIS.

## Safety and scope

- Kembangkan dan uji secara lokal/QA terlebih dahulu. Production hanya boleh disentuh setelah persetujuan eksplisit.
- Jangan reset database, menghapus data, atau menghapus Docker volume.
- Jangan mengubah wedding `vina-hendri` dan `qa-dummy-2`.
- Jangan commit, push, atau deploy tanpa persetujuan eksplisit.
- Jangan menyimpan atau mencetak secret, password, cookie, token, atau hash token.
- Jangan mengklaim PASS tanpa bukti pengujian yang dapat diulang.
- Setiap agent wajib menghormati scope dan tidak mengambil alih tugas agent lain.
- Setiap perubahan wajib disertai daftar file, alasan, dan hasil verifikasi.

## Repository rules

- Gunakan stack, struktur, dependency, dan perintah yang benar-benar ada di repository; jangan mengarang script atau teknologi.
- Pada tugas setup, jangan mengubah source code aplikasi, database, migration, atau schema.
- Hindari perubahan pada pekerjaan lokal yang belum selesai. Periksa `git status --short` sebelum bekerja dan jangan menimpa perubahan pengguna.
- Semua pekerjaan tetap lokal kecuali pengguna menyetujui tindakan eksternal secara eksplisit.

## Coordination

Backend dan frontend boleh berjalan paralel hanya jika file yang dikerjakan tidak bertabrakan. QA dan reviewer memeriksa hasil secara independen. Reviewer selalu read-only.
