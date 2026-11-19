import type { WeddingConfig } from "@/types/wedding";
import { businessConfig } from "./business-config";

// Data undangan CONTOH (fiktif) untuk halaman demo (/demo). Bukan data
// pelanggan mana pun — jangan pernah memakai data vina-hendri di sini.
// Nama, tanggal, alamat, dan foto hanya contoh; halaman demo memberi label
// "Contoh Demo — data fiktif" yang jelas. Foto memakai aset placeholder
// generik yang sama dengan data awal (bukan foto asli siapa pun).
// RSVP/ucapan dinonaktifkan di demo (lihat prop `demo` di WeddingInvitation)
// dan gift dimatikan supaya tidak ada nomor rekening/e-wallet asli yang tampil.
const placeholderAssets = {
  cover: "/images/couple-hero.webp",
  hero: "/images/couple-hero.webp",
  groomProfile: "/images/couple-hero.webp",
  brideProfile: "/images/couple-editorial.webp",
  editorial: "/images/couple-editorial.webp",
  divider: "/images/couple-divider.webp",
  closing: "/images/couple-divider.webp",
  ogImage: "/images/couple-divider.webp",
};

export const demoWeddingConfig: WeddingConfig = {
  dataStatus: { ready: false, marker: "TODO_REAL_DATA", required: ["Data contoh demo — bukan data produksi"] },
  slug: "demo-contoh",
  couple: { first: "Fajar", second: "Kirana", display: "Fajar & Kirana" },
  groom: {
    fullName: "Fajar Ramadhan", shortName: "Fajar", childOrderLabel: "Putra kedua",
    fatherName: "Bambang Sutrisno", motherName: "Siti Aminah",
    parents: "Putra kedua dari Bapak Bambang Sutrisno & Ibu Siti Aminah",
    instagram: "", image: placeholderAssets.groomProfile,
  },
  bride: {
    fullName: "Kirana Dewi", shortName: "Kirana", childOrderLabel: "Putri pertama",
    fatherName: "Agus Wijaya", motherName: "Rina Marlina",
    parents: "Putri pertama dari Bapak Agus Wijaya & Ibu Rina Marlina",
    instagram: "", image: placeholderAssets.brideProfile,
  },
  guest: { fallbackName: "Tamu Undangan", maxLength: 60 },
  weddingDate: "2027-06-13T09:00:00+07:00",
  dateLabel: "13 . 06 . 2027",
  events: [
    {
      id: "akad", title: "Akad Nikah", day: "Minggu", date: "13 Juni 2027", time: "09.00–10.00",
      startTime: "09:00", endTime: "10:00", venue: "Gedung Serbaguna Contoh",
      address: "Jl. Contoh Raya No. 12, Kota Sukabumi",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Kota+Sukabumi",
      mapsEmbedUrl: "", panoramaId: "",
      calendar: { start: "2027-06-13T09:00:00+07:00", end: "2027-06-13T10:00:00+07:00", timezone: "Asia/Jakarta", description: "Contoh undangan akad nikah Fajar Ramadhan dan Kirana Dewi" },
    },
    {
      id: "reception", title: "Resepsi", day: "Minggu", date: "13 Juni 2027", time: "11.00–Selesai",
      startTime: "11:00", endTime: "Selesai", venue: "Gedung Serbaguna Contoh",
      address: "Jl. Contoh Raya No. 12, Kota Sukabumi",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Kota+Sukabumi",
      mapsEmbedUrl: "", panoramaId: "",
      calendar: { start: "2027-06-13T11:00:00+07:00", end: "2027-06-13T23:59:00+07:00", timezone: "Asia/Jakarta", description: "Contoh undangan resepsi Fajar Ramadhan dan Kirana Dewi" },
    },
  ],
  venues: { akad: "Gedung Serbaguna Contoh", reception: "Gedung Serbaguna Contoh" },
  quotes: {
    opening: { text: "Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.", source: "QS. Ar-Rūm: 21" },
    divider: "Dua hati, satu tujuan.",
    closing: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Anda berkenan hadir dan memberikan doa restu.",
    thankYou: "Terima kasih.",
  },
  loveStory: [
    { id: "contoh-bertemu", year: "2023", title: "Pertama Bertemu", description: "Contoh cerita: sebuah pertemuan singkat yang tak disangka menjadi awal dari segalanya. Bagian ini akan diisi dengan kisah asli kedua mempelai." },
    { id: "contoh-lamaran", year: "2026", title: "Lamaran", description: "Contoh cerita: atas kehendak-Nya serta restu kedua orang tua, kami melangsungkan lamaran dan mulai merencanakan hari bahagia ini." },
    { id: "contoh-menikah", year: "13 Juni 2027", title: "Menikah", description: "Contoh cerita: dengan memohon rahmat dan ridha Allah, kami memutuskan untuk mengikrarkan janji suci pernikahan." },
  ],
  assets: placeholderAssets,
  gallery: [
    { src: placeholderAssets.hero, alt: "Foto contoh pasangan", position: "50% 62%" },
    { src: placeholderAssets.editorial, alt: "Foto contoh editorial pasangan" },
    { src: placeholderAssets.divider, alt: "Foto contoh pasangan" },
    { src: placeholderAssets.editorial, alt: "Foto contoh galeri", position: "40% 50%" },
    { src: placeholderAssets.hero, alt: "Detail foto contoh", position: "50% 85%" },
  ],
  gift: { enabled: false, intro: "Doa restu Anda merupakan hadiah terbaik bagi kami.", emptyMessage: "Contoh: informasi tanda kasih akan tampil di sini setelah diisi pemilik undangan.", accounts: [] },
  music: { enabled: false, src: "", title: "", loop: true },
  socialLinks: {},
  metadata: {
    title: "Contoh Undangan — Fajar & Kirana (Demo UNDANGI)",
    description: "Contoh undangan digital UNDANGI. Semua data hanya contoh fiktif.",
    ogTitle: "Contoh Undangan — Fajar & Kirana (Demo UNDANGI)",
    ogDescription: "Contoh undangan digital UNDANGI. Semua data hanya contoh fiktif.",
    siteUrl: businessConfig.siteUrl,
    canonicalUrl: `${businessConfig.siteUrl}/demo`,
    weddingUrl: `${businessConfig.siteUrl}/demo`,
    shareUrl: `${businessConfig.siteUrl}/demo`,
    locale: "id_ID",
  },
  rsvp: { enabled: true, maxGuests: 4, maxNameLength: 60, maxMessageLength: 240, minSubmitMs: 1200 },
  wishes: { enabled: true, pageSize: 10, maxNameLength: 60, maxMessageLength: 280, minSubmitMs: 1200, emptyMessage: "Belum ada ucapan. Jadilah yang pertama mengirim doa baik." },
  theme: { primary: "#6F1D2A", dark: "#3D0F18", accent: "#8B2635", cream: "#F7EFE7", gold: "#C9A66B", softWhite: "#FFF9F5", text: "#261719" },
};
