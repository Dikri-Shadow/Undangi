const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://undangi.my.id").replace(/\/$/, "");
const whatsappNumber = "6285863367362";
const whatsappMessage = "Halo UNDANGI, saya ingin membuat undangan digital. Saya ingin konsultasi mengenai desain dan kebutuhan acara.";

export const businessConfig = {
  brand: "UNDANGI",
  headline: "Undangan Digital Cantik Mulai Rp29.000",
  tagline: "Pilih tema yang kamu suka, isi formulir singkat, admin yang buatkan undangannya. Tanpa ribet, tanpa perlu bisa desain.",
  siteUrl,
  whatsapp: {
    displayNumber: "085863367362",
    internationalNumber: whatsappNumber,
    message: whatsappMessage,
    url: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`,
  },
  instagramUrl: null as string | null,
  pricing: {
    title: "Tema dan Harga",
    description: "Harga peluncuran — Diskon Awal sampai 31 Desember 2026. Tema diurutkan dari desain paling simpel ke paling mewah; harga mengikuti kerumitan desain tema, bukan fitur. Pilih tema yang paling kamu banget, lalu isi formulir di bawah. Admin akan menghubungi kamu untuk konfirmasi dan pembayaran manual (transfer bank / QRIS).",
    note: "Harga di bawah sudah harga diskon. Harga coret adalah harga normal. Semua tema sudah termasuk semua fitur — perbedaan harga hanya pada desain tema.",
    discountUntil: "2026-12-31",
    // Jual per tema (bukan per paket): satu harga per tema, fitur sama untuk semua tema.
    featuresIncluded: ["RSVP + ucapan", "Galeri foto + musik", "Countdown + peta", "Love story", "Gift (bank / e-wallet)", "Link tamu personal"],
    // Urutan tampil: dari desain paling simpel ke paling mewah (harga naik mengikuti kerumitan).
    themes: [
      { slug: "sage-klasik", name: "Sage Klasik", amount: 29000, originalAmount: 49000, discountPercent: 41, tier: "Desain simpel", description: "Hijau sage tenang, nuansa taman." },
      { slug: "terracotta-senja", name: "Terracotta Senja", amount: 29000, originalAmount: 49000, discountPercent: 41, tier: "Desain simpel", description: "Oranye tanah hangat, artisanal premium." },
      { slug: "blush-sakura", name: "Blush Sakura", amount: 49000, originalAmount: 79000, discountPercent: 38, tier: "Desain menengah", description: "Romantis lembut, feminin modern." },
      { slug: "jakarta-modern", name: "Jakarta Modern", amount: 49000, originalAmount: 79000, discountPercent: 38, tier: "Desain menengah", description: "Bersih minimalis, profesional." },
      { slug: "emas-tengah-malam", name: "Emas Tengah Malam", amount: 99000, originalAmount: 149000, discountPercent: 34, tier: "Desain paling mewah", description: "Mode gelap, hitam + emas. Paling mewah." },
    ],
  },
  demoUrl: "/demo",
  metadata: {
    title: "UNDANGI — Undangan Digital",
    description: "Undangan pernikahan digital yang elegan, interaktif, personal, dan mudah dibagikan.",
    canonicalUrl: siteUrl,
    ogImage: "/images/couple-divider.webp",
  },
} as const;
