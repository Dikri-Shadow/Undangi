import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { weddingConfig } from "../data/wedding-config";
import { calculateCompleteness, localDraftKey, normalizeWeddingConfig, parseLocalDraft, serializeLocalDraft } from "../lib/admin-workflow";
import { isAdminNavItemActive } from "../lib/admin-navigation";

test("completeness is calculated by meaningful sections", () => {
  const complete = calculateCompleteness(weddingConfig);
  assert.equal(complete.total, 10);
  assert.ok(complete.completed > 0);
  const draft = structuredClone(weddingConfig); draft.assets.cover = ""; draft.assets.hero = "";
  assert.equal(calculateCompleteness(draft).items.find((item) => item.id === "main-media")?.complete, false);
});

test("completeness safely handles malformed wedding data without making it complete", () => {
  const malformed = { slug: "qa", bride: undefined, groom: undefined, events: undefined, loveStory: undefined, gallery: undefined, gift: undefined, music: undefined, assets: undefined, metadata: undefined } as never;
  const result = calculateCompleteness(malformed);
  assert.equal(result.total, 10);
  assert.equal(result.completed, 0);
  assert.equal(result.percent, 0);
  const normalized = normalizeWeddingConfig(malformed);
  assert.deepEqual(normalized.events, []);
  assert.deepEqual(normalized.gallery, []);
  assert.deepEqual(normalized.loveStory, []);
});

test("local recovery is versioned and scoped to an invitation", () => {
  const raw = serializeLocalDraft("invitation-a", "draft", weddingConfig, "2026-09-28T00:00:00.000Z");
  assert.equal(localDraftKey("invitation-a"), "undangi:admin-draft:v1:invitation-a");
  assert.equal(parseLocalDraft(raw, "invitation-a")?.weddingData.slug, weddingConfig.slug);
  assert.equal(parseLocalDraft(raw, "invitation-b"), null);
  assert.equal(parseLocalDraft("not-json", "invitation-a"), null);
});

test("active, trash, and public loaders enforce deleted state", () => {
  const adapter = readFileSync("services/adapters/supabase-cms-adapter.ts", "utf8");
  assert.match(adapter, /async list\(\).*deleted_at=is\.null/);
  assert.match(adapter, /async listTrash\(\).*deleted_at=not\.is\.null/);
  assert.match(adapter, /getPublishedBySlug.*status=eq\.published&deleted_at=is\.null/);
});

test("wedding create and update fall back to the full name when the nickname is empty", () => {
  const adapter = readFileSync("services/adapters/supabase-cms-adapter.ts", "utf8");
  const create = adapter.slice(adapter.indexOf("async create("), adapter.indexOf("async update("));
  const update = adapter.slice(adapter.indexOf("async update("), adapter.indexOf("async softDelete("));
  for (const method of [create, update]) {
    assert.match(method, /bride_name: config\.bride\.shortName \|\| config\.bride\.fullName/);
    assert.match(method, /groom_name: config\.groom\.shortName \|\| config\.groom\.fullName/);
  }
});

test("delete and restore handlers keep authorization and origin checks without UX-only reauth", () => {
  const remove = readFileSync("app/api/admin/weddings/[id]/route.ts", "utf8");
  const restore = readFileSync("app/api/admin/weddings/[id]/restore/route.ts", "utf8");
  for (const source of [remove, restore]) {
    assert.match(source, /requireAdminApi/);
    assert.match(source, /isSameOrigin/);
  }
  assert.doesNotMatch(remove.slice(remove.indexOf("export async function DELETE")), /hasRecentReauth|invitationSlugConfirmationSchema/);
  assert.doesNotMatch(restore, /hasRecentReauth|invitationSlugConfirmationSchema/);
});

test("delete clients use the minimal JSON contract without legacy confirmation fields", () => {
  const list = readFileSync("components/admin/invitation-table.tsx", "utf8");
  const settings = readFileSync("components/admin/danger-zone.tsx", "utf8");
  for (const source of [list, settings]) {
    assert.match(source, /method: "DELETE", headers: \{ "Content-Type": "application\/json" \}, body: "\{\}"/);
    assert.doesNotMatch(source, /confirmation|confirmSlug|password|reauth/);
  }
});

test("delete handler validates id, soft-deletes active rows, and reports deleted rows", () => {
  const remove = readFileSync("app/api/admin/weddings/[id]/route.ts", "utf8");
  const deleteHandler = remove.slice(remove.indexOf("export async function DELETE"));
  assert.match(deleteHandler, /invitationIdPattern\.test\(id\)/);
  assert.match(deleteHandler, /getById\(id\)/);
  assert.match(deleteHandler, /getDeletedById\(id\)/);
  assert.match(deleteHandler, /softDelete\(id, user\.email\)/);
  assert.match(deleteHandler, /Undangan sudah berada di Sampah/);
  assert.match(deleteHandler, /Gagal menghapus undangan/);
  assert.doesNotMatch(deleteHandler, /hardDelete|\.delete\(/);
});

test("invitation action menus share one controlled open menu id", () => {
  const list = readFileSync("components/admin/invitation-table.tsx", "utf8");
  assert.match(list, /openMenuId, setOpenMenuId/);
  assert.match(list, /current === row\.id \? null : row\.id/);
  assert.match(list, /setOpenMenuId\(null\); setDeleting\(row\)/);
  assert.match(list, /event\.key === "Escape"/);
  assert.doesNotMatch(list, /<details|<summary/);
});

test("soft delete is guarded and restore updates the same row id", () => {
  const adapter = readFileSync("services/adapters/supabase-cms-adapter.ts", "utf8");
  assert.match(adapter, /softDelete\(id.*id=eq\.\$\{encodeURIComponent\(id\)\}&deleted_at=is\.null/);
  assert.match(adapter, /restore\(id.*id=eq\.\$\{encodeURIComponent\(id\)\}&deleted_at=not\.is\.null/);
  assert.match(adapter, /body: JSON\.stringify\(\{ deleted_at: null/);
  const restoreMethod = adapter.slice(adapter.indexOf("async restore"), adapter.indexOf("async upload"));
  assert.doesNotMatch(restoreMethod, /method: "POST"/);
});

test("restore is idempotent and never creates a duplicate row", () => {
  const restore = readFileSync("app/api/admin/weddings/[id]/restore/route.ts", "utf8");
  assert.match(restore, /getById\(id\)/);
  assert.match(restore, /alreadyActive: true/);
  assert.match(restore, /Undangan sudah aktif/);
  assert.doesNotMatch(restore, /\.create\(|method:\s*"POST"/);
  assert.match(restore, /status: 409/);
});

test("critical admin actions use immediate locks and workspace avoids eager heavy prefetch", () => {
  const create = readFileSync("components/admin/new-invitation-form.tsx", "utf8");
  const invitations = readFileSync("components/admin/invitation-table.tsx", "utf8");
  const editor = readFileSync("components/admin/invitation-editor.tsx", "utf8");
  const trash = readFileSync("components/admin/trash-list.tsx", "utf8");
  const nav = readFileSync("components/admin/invitation-workspace-nav.tsx", "utf8");
  assert.match(create, /submitting\.current/);
  assert.match(invitations, /actionLock\.current/);
  assert.match(editor, /saveLock\.current/);
  assert.match(trash, /restoreLock\.current/);
  assert.doesNotMatch(nav, /requestIdleCallback|setTimeout\(preload|\["\/data", "\/media", "\/preview"\]/);
});

test("dashboard response counts stream without blocking primary invitation data", () => {
  const dashboard = readFileSync("app/admin/page.tsx", "utf8");
  assert.match(dashboard, /<Suspense fallback=/);
  assert.match(dashboard, /async function ResponseSummary/);
  assert.doesNotMatch(dashboard, /Promise\.all\(\[supabaseCmsAdapter\.list/);
});

test("admin navigation keeps nested invitation routes exclusive", () => {
  const cases = [
    ["/admin/invitations", true, false],
    ["/admin/invitations/new", false, true],
    ["/admin/invitations/example-id", true, false],
    ["/admin/invitations/new/anything", false, true],
  ] as const;
  for (const [pathname, invitationsActive, createActive] of cases) {
    assert.equal(isAdminNavItemActive(pathname, "/admin/invitations"), invitationsActive, pathname);
    assert.equal(isAdminNavItemActive(pathname, "/admin/invitations/new"), createActive, pathname);
  }
  assert.equal(isAdminNavItemActive("/admin", "/admin", true), true);
  assert.equal(isAdminNavItemActive("/admin/invitations", "/admin", true), false);
});

test("dashboard action menus prefer an upward placement to avoid bottom clipping", () => {
  const dashboard = readFileSync("app/admin/page.tsx", "utf8");
  const table = readFileSync("components/admin/invitation-table.tsx", "utf8");
  assert.match(dashboard, /preferDropUp/);
  assert.match(table, /preferDropUp/);
  assert.match(table, /bottom-full mb-1/);
});

test("invitation list opens the dedicated management workspace", () => {
  const list = readFileSync("components/admin/invitation-table.tsx", "utf8");
  assert.match(list, /Kelola Undangan/);
  assert.match(list, /href=\{`\/admin\/invitations\/\$\{row\.id\}`\}/);
});

test("management workspace exposes operational links and editor entry point", () => {
  const management = readFileSync("app/admin/invitations/[id]/page.tsx", "utf8");
  for (const path of ["/rsvp", "/wishes", "/preview", "/settings"]) assert.match(management, new RegExp(path.replace("/", "\\/")));
  assert.match(management, /Edit Isi Undangan/);
});

test("editor returns to management without dropping existing dirty-state warning", () => {
  const editor = readFileSync("components/admin/invitation-editor.tsx", "utf8");
  assert.match(editor, /href=\{`\/admin\/invitations\/\$\{record\.id\}`\}/);
  assert.match(editor, /Perubahan belum disimpan\. Tinggalkan editor\?/);
});

test("admin response routes preserve invitation isolation and safe logout", () => {
  const detail = readFileSync("app/admin/rsvp/[slug]/page.tsx", "utf8");
  const logout = readFileSync("components/admin/logout-button.tsx", "utf8");
  const logoutRoute = readFileSync("app/api/admin/auth/logout/route.ts", "utf8");
  const wishes = readFileSync("app/admin/wishes/page.tsx", "utf8");
  const wishesList = readFileSync("app/admin/wishes/[slug]/page.tsx", "utf8");
  const wishesModeration = readFileSync("components/admin/wishes-moderation-list.tsx", "utf8");
  assert.match(detail, /listAdminRsvpForWedding\(slug\)/);
  assert.doesNotMatch(detail, /listAdminRsvp\(\)/);
  assert.match(logout, /fetch\("\/api\/admin\/auth\/logout"/);
  assert.match(logout, /Batal/); assert.match(logout, /Ya, Keluar/);
  assert.match(logoutRoute, /httpOnly/); assert.match(logoutRoute, /expires: new Date\(0\)/);
  assert.match(wishes, /listAdminWishes\(\)/); assert.match(wishesModeration, /whitespace-pre-wrap/);
});

test("dashboard response counts use the same active invitation slug scope as RSVP", () => {
  const dashboard = readFileSync("app/admin/page.tsx", "utf8");
  const responses = readFileSync("services/admin-responses-service.ts", "utf8");
  assert.match(dashboard, /ResponseSummary slugs=\{rows\.filter\(\(row\) => row\.status === "published"\)\.map\(\(row\) => row\.slug\)\}/);
  assert.match(responses, /wedding_slug=in\.\(\$\{weddingSlug\.map/);
  assert.match(responses, /wedding_slug=eq/);
});

test("logout lives in the sidebar/drawer (not the page header) and keeps its icon styling", () => {
  const shell = readFileSync("components/admin/admin-shell.tsx", "utf8");
  const sidebar = readFileSync("components/admin/admin-sidebar.tsx", "utf8");
  const logout = readFileSync("components/admin/logout-button.tsx", "utf8");
  assert.doesNotMatch(shell, /LogoutButton/);
  assert.match(sidebar, /<LogoutButton \/>/);
  assert.match(logout, /<LogOut size=\{17\}/);
  assert.match(logout, /text-\[#BF6D87\]/);
});

test("RSVP index only lists published active invitations and keeps empty invitations visible", () => {
  const index = readFileSync("app/admin/rsvp/page.tsx", "utf8");
  const detail = readFileSync("app/admin/rsvp/[slug]/page.tsx", "utf8");
  assert.match(index, /row\.status === "published" && row\.deletedAt === null/);
  assert.doesNotMatch(index, /filter\(\(item\) => item\.weddingSlug === row\.slug\)\)\.filter/);
  assert.match(detail, /item\.status === "published" && item\.deletedAt === null/);
  assert.match(readFileSync("components/admin/rsvp-results.tsx", "utf8"), /Belum ada konfirmasi kehadiran untuk undangan ini/);
});

test("Wishes index keeps active invitations visible and detail isolates by slug", () => {
  const index = readFileSync("app/admin/wishes/page.tsx", "utf8");
  const detail = readFileSync("app/admin/wishes/[slug]/page.tsx", "utf8");
  assert.match(index, /row\.status === "published" && row\.deletedAt === null/);
  assert.match(index, /wishes\.filter\(\(wish\) => wish\.weddingSlug === row\.slug\)/);
  assert.match(index, /<WishesInvitationList items=\{invitations\}/);
  assert.match(detail, /listAdminWishesForWedding\(slug\)/);
  assert.match(detail, /item\.status === "published" && item\.deletedAt === null/);
  assert.match(detail, /Belum ada ucapan untuk undangan ini/);
});

test("customer recipient API validates opaque token server-side and excludes deleted recipients", () => {
  const service = readFileSync("services/admin-guest-access-service.ts", "utf8");
  const route = readFileSync("app/api/customer/[slug]/recipients/route.ts", "utf8");
  assert.match(service, /createHash\("sha256"\)/);
  assert.match(service, /token_hash=eq\.\$\{hash\}/);
  assert.match(service, /revoked_at=is\.null/);
  assert.match(service, /deleted_at=is\.null/);
  assert.match(service, /select=id,guest_name,created_at,updated_at/);
  assert.doesNotMatch(service, /select=.*token_hash/);
  // Contract changed in Tahap 4: session tokens are validated personal-first
  // then legacy (validateCustomerSessionToken), and the list joins RSVPs via
  // listRecipientsWithRsvp instead of the bare listActiveRecipients.
  assert.match(route, /validateCustomerSessionToken\(slug, session\.token\)/);
  assert.match(route, /listRecipientsWithRsvp\(slug\)/);
  assert.doesNotMatch(route, /console\.(log|warn|error).*token/);
  assert.doesNotMatch(route, /request\.headers\.get\("authorization"\)/);
  assert.doesNotMatch(route, /Bearer\\s/);
  assert.match(route, /sessionFor\(request, slug\)/);
  assert.match(route, /searchParams\.has\("token"\)/);
  assert.doesNotMatch(route, /searchParams\.get\("token"\)/);
});
