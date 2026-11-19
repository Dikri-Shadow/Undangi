import type { WeddingConfig } from "@/types/wedding";
const TODO = "TODO_REAL_DATA" as const;
const productionBaseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://undangi.my.id").replace(/\/$/, "");
const placeholderAssets = { cover: "/images/couple-hero.webp", hero: "/images/couple-hero.webp", groomProfile: "/images/couple-hero.webp", brideProfile: "/images/couple-editorial.webp", editorial: "/images/couple-editorial.webp", divider: "/images/couple-divider.webp", closing: "/images/couple-divider.webp", ogImage: "/images/couple-divider.webp" };

const weddingConfigBase: Omit<WeddingConfig, "dataStatus"> = {
  slug: "vina-hendri",
  couple: { first: "Vina", second: "Hendri", display: "Vina & Hendri" },
  groom: { fullName: "Hendriyana", shortName: "Rohman", childOrderLabel: "Putra pertama", fatherName: "Dadin", motherName: "Nurjanah", parents: "Putra pertama dari Bapak Dadin & Ibu Nurjanah", instagram: "hndri_4436", image: placeholderAssets.groomProfile },
  bride: { fullName: "Vina Amelia", shortName: "Bobot", childOrderLabel: "Putri terakhir", fatherName: "Yayat Muksin", motherName: "Yanah", parents: "Putri terakhir dari Bapak Yayat Muksin & Ibu Yanah", instagram: "vinaamell12", image: placeholderAssets.brideProfile },
  guest: { fallbackName: "Tamu Undangan", maxLength: 60 }, weddingDate: "2026-12-27T09:00:00+07:00", dateLabel: "27 . 12 . 2026",
  events: [
    { id: "akad", title: "Akad Nikah", day: "Minggu", date: "27 Desember 2026", time: "09.00–10.00", startTime: "09:00", endTime: "10:00", venue: "Kediaman Mempelai Wanita", address: "Jalan Lamping RT 05/RW 05", mapsUrl: "https://www.google.com/maps/@0,0,0a,75y/data=!3m4!1e1!3m2!1sK6pwAeXl6Y0IHguaeCuLlQ!2e0?utm_campaign=ml-ardl&g_ep=Eg1tbF8yMDI2MDkyMF8wIJvbDyoASAJQAQ%3D%3D", mapsEmbedUrl: "", panoramaId: "K6pwAeXl6Y0IHguaeCuLlQ", calendar: { start: "2026-12-27T09:00:00+07:00", end: "2026-12-27T10:00:00+07:00", timezone: "Asia/Jakarta", description: "Undangan akad nikah Vina Amelia dan Hendriyana" } },
    { id: "reception", title: "Resepsi", day: "Minggu", date: "27 Desember 2026", time: "10.00–Selesai", startTime: "10:00", endTime: "Selesai", venue: "Kediaman Mempelai Wanita", address: "Jalan Lamping RT 05/RW 05", mapsUrl: "https://www.google.com/maps/@0,0,0a,75y/data=!3m4!1e1!3m2!1sK6pwAeXl6Y0IHguaeCuLlQ!2e0?utm_campaign=ml-ardl&g_ep=Eg1tbF8yMDI2MDkyMF8wIJvbDyoASAJQAQ%3D%3D", mapsEmbedUrl: "", panoramaId: "K6pwAeXl6Y0IHguaeCuLlQ", calendar: { start: "2026-12-27T10:00:00+07:00", end: "2026-12-27T23:59:00+07:00", timezone: "Asia/Jakarta", description: "Undangan resepsi Vina Amelia dan Hendriyana" } },
  ],
  venues: { akad: "Kediaman Mempelai Wanita", reception: "Kediaman Mempelai Wanita" },
  quotes: { opening: { text: "Kutipan pernikahan akan diperbarui setelah data final tersedia.", source: "Kutipan pilihan mempelai" }, divider: "Di antara banyak perjalanan, semoga kita selalu menemukan jalan pulang yang sama.", closing: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Anda berkenan hadir dan memberikan doa restu.", thankYou: "Terima kasih." },
  loveStory: [
    { id: "pertama-bertemu", year: "", title: "Pertama Bertemu", description: "Tak ada yang menyangka bahwa sebuah pertemuan singkat akan menjadi awal dari segalanya. Di antara miliaran kemungkinan, semesta memilih untuk mempertemukan kami dalam satu waktu yang tak terduga, memulai cerita yang telah Tuhan gariskan." },
    { id: "lamaran", year: "20 Desember 2025", title: "Lamaran", description: "Atas kehendak-Nya serta restu dari orang tua dan keluarga, kami melangsungkan lamaran pada 20 Desember 2025. Sejak tanggal pernikahan ditentukan, perjalanan kami justru semakin banyak diuji. Perbedaan pendapat semakin sering terjadi, hal kecil terkadang menjadi besar, ego semakin kuat, dan kami menjadi semakin sensitif mengenai pernikahan. Namun, semua itu menjadi bagian dari perjalanan kami untuk belajar memahami dan menguatkan satu sama lain." },
    { id: "menikah", year: "27 Desember 2026", title: "Menikah", description: "Bukan karena bertemu lalu berjodoh, tetapi karena berjodohlah maka kami dipertemukan. Insyaallah, pada 27 Desember 2026 kami memutuskan untuk mengikrarkan janji suci pernikahan. Sebagaimana perkataan indah Sayyidina Ali bin Abi Thalib, “Apa yang menjadi takdirmu akan menemukan jalannya untuk menemukanmu.”" },
  ],
  assets: placeholderAssets,
  gallery: [
    { src: placeholderAssets.hero, alt: "Foto placeholder pasangan", position: "50% 62%" }, { src: placeholderAssets.editorial, alt: "Foto editorial placeholder pasangan" }, { src: placeholderAssets.divider, alt: "Foto divider placeholder pasangan" }, { src: placeholderAssets.editorial, alt: "Foto galeri placeholder", position: "40% 50%" }, { src: placeholderAssets.hero, alt: "Detail foto placeholder", position: "50% 85%" },
  ],
  gift: { enabled: true, intro: "Doa restu Anda merupakan hadiah terbaik bagi kami. Namun apabila ingin memberikan tanda kasih, dapat melalui akun berikut.", emptyMessage: "Informasi tanda kasih belum tersedia.", accounts: [{ type: "ewallet", provider: "DANA", number: "085659447978", holder: "Vina Amelia" }] },
  music: { enabled: true, src: "/audio/bernaung.mp3", title: "Bernaung", artist: "Feby Putri", loop: true }, socialLinks: {},
  metadata: { title: "The Wedding of Vina & Hendri", description: "Undangan pernikahan Vina & Hendri", ogTitle: "The Wedding of Vina & Hendri", ogDescription: "Undangan pernikahan Vina & Hendri", siteUrl: productionBaseUrl, canonicalUrl: `${productionBaseUrl}/vina-hendri`, weddingUrl: `${productionBaseUrl}/vina-hendri`, shareUrl: `${productionBaseUrl}/vina-hendri`, locale: "id_ID" },
  rsvp: { enabled: true, maxGuests: 4, maxNameLength: 60, maxMessageLength: 240, minSubmitMs: 1200 },
  wishes: { enabled: true, pageSize: 10, maxNameLength: 60, maxMessageLength: 280, minSubmitMs: 1200, emptyMessage: "Belum ada ucapan. Jadilah yang pertama mengirim doa baik." },
  theme: { primary: "#6F1D2A", dark: "#3D0F18", accent: "#8B2635", cream: "#F7EFE7", gold: "#C9A66B", softWhite: "#FFF9F5", text: "#261719" },
};

function isPlaceholder(value: string | undefined) {
  return !value || /TODO_REAL_DATA|placeholder|akan (?:diumumkan|diperbarui|ditambahkan)|Nama (?:Pria|Wanita|Lengkap)|Venue (?:akad|resepsi)|Bapak —|Ibu —/i.test(value);
}

export function getMissingWeddingData(config: Omit<WeddingConfig, "dataStatus">) {
  const missing: string[] = [];
  if ([config.groom.fullName, config.groom.shortName, config.bride.fullName, config.bride.shortName].some(isPlaceholder)) missing.push("Nama lengkap dan panggilan kedua mempelai");
  if ([config.groom.parents, config.bride.parents].some(isPlaceholder)) missing.push("Nama orang tua kedua mempelai");
  if (!config.groom.instagram || !config.bride.instagram) missing.push("Instagram kedua mempelai");
  if (!config.weddingDate || config.events.some((event) => isPlaceholder(event.date) || isPlaceholder(event.time) || !event.calendar.start || !event.calendar.end)) missing.push("Tanggal dan waktu akad/resepsi");
  if (config.events.some((event) => isPlaceholder(event.venue) || isPlaceholder(event.address) || !event.mapsUrl)) missing.push("Venue, alamat, dan Google Maps URL");
  if (config.loveStory.some((story) => isPlaceholder(story.description)) || isPlaceholder(config.quotes.opening.text)) missing.push("Love story dan quote final");
  if (!config.gift.enabled || config.gift.accounts.length === 0) missing.push("Rekening/e-wallet");
  if (Object.values(config.assets).some((path) => /couple-(?:hero|editorial|divider)\.webp$/i.test(path))) missing.push("Foto asli dan OG image");
  if (!config.music.enabled || !config.music.src) missing.push("Musik berlisensi");
  if (!config.metadata.siteUrl || !config.metadata.siteUrl.startsWith("https://") || config.metadata.siteUrl.includes("localhost")) missing.push("Domain production");
  return missing;
}

const required = getMissingWeddingData(weddingConfigBase);
export const weddingConfig: WeddingConfig = { ...weddingConfigBase, dataStatus: { ready: required.length === 0, marker: TODO, required } };

/** Create a customer draft without copying the production demo's content or media. */
export function createNewWeddingConfig(input: { slug: string; brideName: string; groomName: string; brideNickname?: string; groomNickname?: string }): WeddingConfig {
  const config = structuredClone(weddingConfigBase);
  const display = `${input.brideName} & ${input.groomName}`;
  config.slug = input.slug;
  config.couple = { first: input.brideName, second: input.groomName, display };
  config.bride = { fullName: input.brideName, shortName: input.brideNickname || "", parents: "", fatherName: "", motherName: "", instagram: "", image: "" };
  config.groom = { fullName: input.groomName, shortName: input.groomNickname || "", parents: "", fatherName: "", motherName: "", instagram: "", image: "" };
  config.weddingDate = null;
  config.dateLabel = "";
  config.events = config.events.map((event) => ({ ...event, day: "", date: "", time: "", startTime: "", endTime: "", venue: "", address: "", mapsUrl: "", mapsEmbedUrl: "", panoramaId: "", calendar: { ...event.calendar, start: "", end: "", description: "" } }));
  config.venues = { akad: "", reception: "" };
  config.quotes = { opening: { text: "", source: "" }, divider: "", closing: "", thankYou: "" };
  config.loveStory = [];
  config.assets = { cover: "", hero: "", groomProfile: "", brideProfile: "", editorial: "", divider: "", closing: "", ogImage: "" };
  config.mediaPresentation = {};
  config.gallery = [];
  config.gift = { enabled: false, intro: "", emptyMessage: "", accounts: [] };
  config.music = { enabled: false, src: "", title: "", artist: "", loop: true };
  config.socialLinks = {};
  config.metadata = { ...config.metadata, title: display, description: "", ogTitle: display, ogDescription: "", canonicalUrl: `${config.metadata.siteUrl}/${input.slug}`, weddingUrl: `${config.metadata.siteUrl}/${input.slug}`, shareUrl: `${config.metadata.siteUrl}/${input.slug}` };
  return { ...config, dataStatus: { ready: false, marker: TODO, required: getMissingWeddingData(config) } };
}
