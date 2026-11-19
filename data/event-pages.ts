// Konten 3 halaman jenis acara (/acara/pernikahan, /acara/khitanan,
// /acara/aqiqah). Satu template yang sama (components/marketing/event-page.tsx)
// merender ketiganya — yang berbeda hanya data di sini.
//
// Isi checklist dibatasi pada data yang memang dibutuhkan untuk membuat
// undangan (nama, tanggal, lokasi, foto, susunan acara, hadiah, daftar tamu).
// Jangan tambahkan klaim apa pun di sini (rating/testimoni/statistik) —
// UNDANGI belum punya itu.
export type EventPageContent = {
  slug: string;
  name: string;
  title: string;
  metaDescription: string;
  intro: string;
  checklistTitle: string;
  checklist: { label: string; detail: string }[];
};

export const eventPages: EventPageContent[] = [
  {
    slug: "pernikahan",
    name: "Pernikahan",
    title: "Undangan Digital Pernikahan",
    metaDescription:
      "Buat undangan digital pernikahan — pilih tema, kirim data acara, admin yang buatkan. Harga per tema mulai Rp29.000, masa aktif 1 tahun.",
    intro:
      "Undangan digital pernikahan untuk akad dan resepsi dalam satu link. Pilih tema yang paling kamu banget, kirim data acara, dan admin yang buatkan — kamu lihat hasilnya dulu, bayar hanya kalau suka.",
    checklistTitle: "Data yang perlu disiapkan untuk undangan pernikahan",
    checklist: [
      { label: "Nama kedua mempelai", detail: "Nama lengkap mempelai wanita dan pria seperti yang ingin tampil di undangan." },
      { label: "Tanggal dan waktu acara", detail: "Tanggal akad dan resepsi beserta jamnya." },
      { label: "Lokasi acara", detail: "Alamat gedung atau rumah, plus tautan Google Maps bila ada." },
      { label: "Foto mempelai dan galeri", detail: "Foto berdua untuk sampul dan galeri — foto prewedding bila ada." },
      { label: "Susunan acara", detail: "Rundown akad, resepsi, dan hiburan bila ada." },
      { label: "Rekening atau e-wallet hadiah", detail: "Nomor rekening atau e-wallet untuk amplop digital, bila ingin menerima hadiah lewat undangan." },
      { label: "Daftar nama tamu", detail: "Nama-nama tamu supaya tiap tamu menerima link undangan dengan namanya sendiri." },
    ],
  },
  {
    slug: "khitanan",
    name: "Khitanan",
    title: "Undangan Digital Khitanan",
    metaDescription:
      "Buat undangan digital khitanan — pilih tema, kirim data acara, admin yang buatkan. Harga per tema mulai Rp29.000, masa aktif 1 tahun.",
    intro:
      "Undangan digital khitanan untuk mengabarkan acara syukuran khitanan putra kamu. Pilih tema, kirim data acara, dan admin yang buatkan — kamu lihat hasilnya dulu, bayar hanya kalau suka.",
    checklistTitle: "Data yang perlu disiapkan untuk undangan khitanan",
    checklist: [
      { label: "Nama anak yang dikhitan", detail: "Nama lengkap anak seperti yang ingin tampil di undangan." },
      { label: "Nama orang tua", detail: "Nama ayah dan ibu." },
      { label: "Tanggal dan waktu acara", detail: "Tanggal dan jam acara khitanan." },
      { label: "Lokasi acara", detail: "Alamat tempat acara, plus tautan Google Maps bila ada." },
      { label: "Foto anak", detail: "Foto anak untuk sampul dan galeri." },
      { label: "Susunan acara", detail: "Rundown acara bila ada." },
      { label: "Daftar nama tamu", detail: "Nama-nama tamu supaya tiap tamu menerima link undangan dengan namanya sendiri." },
    ],
  },
  {
    slug: "aqiqah",
    name: "Aqiqah",
    title: "Undangan Digital Aqiqah",
    metaDescription:
      "Buat undangan digital aqiqah — pilih tema, kirim data acara, admin yang buatkan. Harga per tema mulai Rp29.000, masa aktif 1 tahun.",
    intro:
      "Undangan digital aqiqah untuk tasyakuran kelahiran buah hati. Pilih tema, kirim data acara, dan admin yang buatkan — kamu lihat hasilnya dulu, bayar hanya kalau suka.",
    checklistTitle: "Data yang perlu disiapkan untuk undangan aqiqah",
    checklist: [
      { label: "Nama bayi", detail: "Nama lengkap bayi seperti yang ingin tampil di undangan." },
      { label: "Nama orang tua", detail: "Nama ayah dan ibu." },
      { label: "Tanggal dan waktu tasyakuran", detail: "Tanggal dan jam acara tasyakuran." },
      { label: "Lokasi acara", detail: "Alamat tempat acara, plus tautan Google Maps bila ada." },
      { label: "Foto bayi", detail: "Foto bayi untuk sampul dan galeri." },
      { label: "Susunan acara", detail: "Rundown acara bila ada." },
      { label: "Daftar nama tamu", detail: "Nama-nama tamu supaya tiap tamu menerima link undangan dengan namanya sendiri." },
    ],
  },
];

export function getEventPage(slug: string): EventPageContent | undefined {
  return eventPages.find((page) => page.slug === slug);
}
