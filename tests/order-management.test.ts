import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createOrderSchema, isOrderStatusTransitionAllowed, orderQuerySchema } from "../lib/order-validation";

const repoRoot = process.cwd();
function read(...parts: string[]) {
  return readFileSync(join(repoRoot, ...parts), "utf8");
}

test("order form is short: event type, WhatsApp, event date + theme, with a WA admin escape hatch", () => {
  const form = read("components", "marketing", "order-form.tsx");
  assert.ok(form.includes('name="customerWhatsapp"'), "form must ask for WhatsApp number");
  assert.ok(form.includes('name="weddingDate"'), "form must ask for event date");
  assert.ok(form.includes("Jenis acara"), "form must ask for event type");
  assert.ok(form.includes("Minta dibuatin admin lewat WhatsApp"), "form must offer the WA admin escape hatch");
  assert.ok(!form.includes('name="customerName"'), "short form must not ask for customer name");
  assert.ok(!form.includes('name="customerEmail"'), "short form must not ask for email");
  assert.ok(form.includes('customerNotes: `Jenis acara: ${eventType}`'), "event type must still be recorded in the order notes");
});

const valid = { customerName: "Pelanggan QA", customerWhatsapp: "081234567890", packageCode: "konsultasi" };

test("order validation accepts required customer data", () => { assert.equal(createOrderSchema.safeParse(valid).success, true); });
test("order validation accepts an order without customerName (short form: route fills a WA-based display name)", () => {
  const withoutName = { customerWhatsapp: "081234567890", packageCode: "blush-sakura" };
  assert.equal(createOrderSchema.safeParse(withoutName).success, true);
  assert.equal(createOrderSchema.safeParse({ ...withoutName, customerName: "" }).success, true);
  // Nama yang diisi tetap dibatasi 120 karakter.
  assert.equal(createOrderSchema.safeParse({ ...withoutName, customerName: "x".repeat(121) }).success, false);
});
test("order validation rejects missing, malformed, and oversized input", () => {
  assert.equal(createOrderSchema.safeParse({ ...valid, customerWhatsapp: "abc" }).success, false);
  assert.equal(createOrderSchema.safeParse({ ...valid, customerWhatsapp: "" }).success, false);
  assert.equal(createOrderSchema.safeParse({ ...valid, customerNotes: "x".repeat(2001) }).success, false);
  assert.equal(createOrderSchema.safeParse({ customerWhatsapp: "081234567890" }).success, false);
});
test("order status transitions enforce the lifecycle", () => {
  assert.equal(isOrderStatusTransitionAllowed("new", "in_progress"), true);
  assert.equal(isOrderStatusTransitionAllowed("new", "completed"), false);
  assert.equal(isOrderStatusTransitionAllowed("completed", "in_progress"), false);
  assert.equal(isOrderStatusTransitionAllowed("waiting_customer", "in_progress"), true);
});
test("order query validation bounds pagination and accepts combined filters", () => {
  const parsed = orderQuerySchema.parse({ q: "UND-ABC", orderStatus: "in_progress", paymentStatus: "unpaid", page: "2", pageSize: "20" });
  assert.deepEqual(parsed, { q: "UND-ABC", orderStatus: "in_progress", paymentStatus: "unpaid", page: 2, pageSize: 20 });
  assert.equal(orderQuerySchema.safeParse({ page: "0" }).success, false);
  assert.equal(orderQuerySchema.safeParse({ pageSize: "51" }).success, false);
});
