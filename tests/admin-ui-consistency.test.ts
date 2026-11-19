import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (...parts: string[]) => readFileSync(join(root, ...parts), "utf8");

test("shared admin UI exports one StatCard, StatusBadge, and EmptyState", () => {
  const source = read("components", "admin", "admin-ui.tsx");
  for (const name of ["StatCard", "StatusBadge", "OrderStatusBadge", "PaymentStatusBadge", "AttendanceBadge", "WeddingStatusBadge", "ModerationBadge", "EmptyState"]) {
    assert.match(source, new RegExp(`export function ${name}\\b`), `admin-ui must export ${name}`);
  }
  // Kartu putih lembut Blush Sakura: radius 24px + bayangan halus, bukan kotak kaku.
  assert.match(source, /#BF6D87/);
  assert.match(source, /rounded-3xl border border-\[#F2D9D3\] bg-white/);
  assert.match(source, /shadow-\[0_1px_3px_rgba\(72,44,52,.05\),0_10px_28px_rgba\(72,44,52,.05\)\]/);
});

test("orders page uses the shared AdminPage shell, badges, and empty state", () => {
  const source = read("app", "admin", "orders", "page.tsx");
  assert.match(source, /AdminPage title="Pesanan"/);
  assert.match(source, /OrderStatusBadge status=\{order\.orderStatus\}/);
  assert.match(source, /PaymentStatusBadge status=\{order\.paymentStatus\}/);
  assert.match(source, /EmptyState icon=\{Search\}/);
  assert.doesNotMatch(source, /font-blush-display text-4xl/);
  assert.doesNotMatch(source, /\{order\.orderStatus\}<\/td>/);
});

test("income page uses the shared AdminPage shell and StatCard", () => {
  const source = read("app", "admin", "income", "page.tsx");
  assert.match(source, /AdminPage title="Pendapatan"/);
  assert.match(source, /StatCard label="Pemasukan"/);
  assert.match(source, /StatCard label="Order lunas"/);
  assert.match(source, /EmptyState icon=\{Wallet\}/);
  assert.doesNotMatch(source, /font-blush-display text-4xl/);
  assert.doesNotMatch(source, /function Metric/);
});

test("dashboard uses the shared StatCard for its KPI cards", () => {
  const source = read("app", "admin", "page.tsx");
  assert.match(source, /StatCard label="Total Undangan"/);
  assert.match(source, /StatCard label="Published"/);
  assert.doesNotMatch(source, /function Stat\(/);
});

test("rsvp results use the shared StatCard and AttendanceBadge", () => {
  const source = read("components", "admin", "rsvp-results.tsx");
  assert.match(source, /StatCard icon=\{CalendarDays\} label="Total respons"/);
  assert.match(source, /AttendanceBadge value=\{item\.rsvp\.attendance\}/);
  assert.match(source, /AttendanceBadge value=\{row\.attendance\}/);
  assert.doesNotMatch(source, /function Stat\(/);
  assert.doesNotMatch(source, /function Attendance\(/);
});

test("invitation table uses the shared WeddingStatusBadge", () => {
  const source = read("components", "admin", "invitation-table.tsx");
  assert.match(source, /WeddingStatusBadge status=\{row\.status\}/);
  assert.doesNotMatch(source, /export function Status\(/);
});

test("wishes moderation uses the shared ModerationBadge and EmptyState", () => {
  const source = read("components", "admin", "wishes-moderation-list.tsx");
  assert.match(source, /ModerationBadge status=\{row\.moderationStatus\}/);
  assert.match(source, /EmptyState icon=\{MessageCircle\}/);
});

test("status badges use Indonesian labels everywhere", () => {
  const ui = read("components", "admin", "admin-ui.tsx");
  assert.match(ui, /"Dipublikasikan"/);
  assert.match(ui, /"Draf"/);
  assert.doesNotMatch(ui, /"Published"/);
  const table = read("components", "admin", "invitation-table.tsx");
  assert.match(table, /"Dipublikasikan"/);
  assert.match(table, /"Draf"/);
  assert.match(table, /whitespace-nowrap/);
  const trash = read("components", "admin", "trash-list.tsx");
  assert.match(trash, /WeddingStatusBadge status=\{row\.status\}/);
  assert.doesNotMatch(trash, /Status sebelumnya \{row\.status/);
});

test("rsvp filter and empty states use Indonesian labels and the shared EmptyState", () => {
  const rsvp = read("components", "admin", "rsvp-results.tsx");
  assert.match(rsvp, /"Tidak hadir"/);
  assert.match(rsvp, /EmptyState icon=\{UsersRound\} title="Belum ada recipient aktif"/);
  const wishes = read("app", "admin", "wishes", "[slug]", "page.tsx");
  assert.match(wishes, /EmptyState icon=\{MessageCircle\} title="Belum ada ucapan untuk undangan ini"/);
  const invitationWishes = read("app", "admin", "invitations", "[id]", "wishes", "page.tsx");
  assert.match(invitationWishes, /EmptyState icon=\{MessageCircle\} title="Belum ada ucapan dan doa"/);
});

test("mobile admin top bar has a hamburger menu and only the bell outside it", () => {
  const sidebar = read("components", "admin", "admin-sidebar.tsx");
  // Tombol hamburger (ikon Menu) hanya di HP, membuka drawer.
  assert.match(sidebar, /aria-label="Buka menu navigasi"/);
  assert.match(sidebar, /<Menu size=\{22\}/);
  assert.match(sidebar, /useState\(false\)/);
  // Lonceng ada di bar atas HP (kanan) dan di header sidebar PC — satu instance per viewport.
  assert.match(sidebar, /WishNotificationBell/);
  assert.doesNotMatch(sidebar, /Navigasi admin mobile/);
  // Drawer: navigasi berlabel + tombol keluar, tutup via backdrop/Escape/navigasi.
  assert.match(sidebar, /role="dialog" aria-modal="true" aria-label="Menu navigasi"/);
  assert.match(sidebar, /aria-label="Tutup menu"/);
  assert.match(sidebar, /event\.key === "Escape"/);
  assert.match(sidebar, /document\.body\.style\.overflow = "hidden"/);
  assert.match(sidebar, /animate-\[admin-drawer-in/);
  assert.match(sidebar, /max-w-\[85vw\]/);
  // Lonceng TIDAK ada di dalam drawer.
  const drawer = sidebar.slice(sidebar.indexOf('role="dialog"'));
  assert.doesNotMatch(drawer, /WishNotificationBell/);
});

test("dashboard header no longer carries the bell or logout; primary action is thumb-sized", () => {
  const dashboard = read("app", "admin", "page.tsx");
  assert.doesNotMatch(dashboard, /WishNotificationBell/);
  assert.match(dashboard, /min-h-12 items-center justify-center rounded-full bg-\[#BF6D87\]/);
  const shell = read("components", "admin", "admin-shell.tsx");
  assert.doesNotMatch(shell, /LogoutButton/);
  // Aksi header selebar layar di HP, sejajar di kanan di PC.
  assert.match(shell, /flex flex-col gap-3 \*:w-full sm:flex-row sm:items-center sm:\*:w-auto/);
  const invitations = read("app", "admin", "invitations", "page.tsx");
  assert.match(invitations, /min-h-12 items-center justify-center rounded-full bg-\[#BF6D87\]/);
});

test("stat cards are compact on mobile: 2 columns, not stacked rows", () => {
  // Di HP kartu statistik berdampingan 2 kolom (padat tapi rapi),
  // bukan berbaris 1 kolom yang boros ruang vertikal.
  const dashboard = read("app", "admin", "page.tsx");
  assert.match(dashboard, /grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4/);
  assert.match(dashboard, /mt-3 grid grid-cols-2 gap-3 sm:mt-4 sm:grid-cols-3 sm:gap-4/);
  const income = read("app", "admin", "income", "page.tsx");
  assert.match(income, /mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4/);
  assert.match(income, /mt-3 grid grid-cols-2 gap-3 sm:grid-cols-2/);
  const rsvp = read("components", "admin", "rsvp-results.tsx");
  assert.match(rsvp, /grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4/);
  const customer = read("components", "customer", "customer-guest-management.tsx");
  assert.match(customer, /mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4/);
  // StatCard sendiri responsif: lebih ringkas di HP, lega di layar besar.
  const ui = read("components", "admin", "admin-ui.tsx");
  assert.match(ui, /px-4 py-4 shadow-\[0_1px_3px_rgba\(72,44,52,.05\),0_10px_28px_rgba\(72,44,52,.05\)\] sm:px-6 sm:py-5/);
  assert.match(ui, /text-\[28px\] font-bold leading-8 tabular-nums text-\[#482C34\] sm:mt-3 sm:text-\[32px\] sm:leading-9/);
});

test("Blush Sakura theme is applied to landing, customer, and admin — invitations untouched", () => {
  const layout = read("app", "layout.tsx");
  assert.match(layout, /Italiana/);
  assert.match(layout, /Quicksand/);
  assert.match(layout, /--font-blush-display/);
  assert.match(layout, /--font-blush-body/);
  // Font undangan live tetap Cormorant/Manrope.
  assert.match(layout, /Cormorant_Garamond/);
  assert.match(layout, /Manrope/);
  assert.match(layout, /themeColor: "#482C34"/);
  const globals = read("app", "globals.css");
  assert.match(globals, /\.font-blush-display \{ font-family: var\(--font-blush-display\)/);
  assert.match(globals, /\.font-blush-body \{ font-family: var\(--font-blush-body\)/);
  // Variabel tema lama (untuk undangan) tidak diubah.
  assert.match(globals, /--burgundy: #6f1d2a/);
  assert.match(globals, /--background: #fff9f5/);
  const adminLayout = read("app", "admin", "layout.tsx");
  assert.match(adminLayout, /bg-\[#FDF3F1\] font-blush-body/);
  const landing = read("components", "marketing", "landing-page.tsx");
  assert.match(landing, /bg-\[#FDF3F1\] font-blush-body/);
  assert.match(landing, /font-blush-display/);
  assert.doesNotMatch(landing, /#6F1D2A/);
  const customer = read("components", "customer", "customer-guest-management.tsx");
  assert.match(customer, /bg-\[#FDF3F1\]/);
  assert.doesNotMatch(customer, /#6f1d2a/);
  // Undangan live TIDAK berubah tampilannya: tema burgundy di wedding-config
  // tetap, dan komponen undangan memakai variabel --w-* yang default-nya
  // SAMA PERSIS dengan warna burgundy lama (lihat globals.css) — jadi
  // vina-hendri tetap burgundy; hanya halaman demo yang menimpa variabel itu.
  const weddingConfig = read("data", "wedding-config.ts");
  assert.match(weddingConfig, /primary: "#6F1D2A"/);
  assert.match(weddingConfig, /cream: "#F7EFE7"/);
  assert.match(globals, /--w-primary: var\(--burgundy\)/);
  assert.match(globals, /--w-dark: var\(--burgundy-dark\)/);
  assert.match(globals, /--w-soft-white: var\(--background\)/);
  const invitation = read("components", "wedding", "wedding-invitation.tsx");
  assert.match(invitation, /bg-\[var\(--w-soft-white\)\]/);
  const invitationPage = read("app", "[slug]", "page.tsx");
  assert.match(invitationPage, /WeddingInvitation/);
});

test("customer guest management uses the shared StatCard, badges, and EmptyState", () => {
  const source = read("components", "customer", "customer-guest-management.tsx");
  assert.match(source, /StatCard label="Total"/);
  assert.match(source, /StatCard label="Hadir"/);
  assert.match(source, /AttendanceBadge value="hadir"/);
  assert.match(source, /EmptyState icon=\{Users\}/);
  assert.doesNotMatch(source, /font-blush-display text-4xl/);
  // Link tamu selalu tersedia (tanpa token sekali pakai).
  assert.doesNotMatch(source, /oneTimeLinks/);
  assert.match(source, /buildGuestLink\(window\.location\.origin, slug, row\.guestName\)\.url/);
});
