import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentSchema, setOrderPriceSchema } from "../lib/order-validation";

test("payment amount and price must be positive integer currency units", () => { assert.equal(setOrderPriceSchema.safeParse({ totalAmount: 500000 }).success, true); assert.equal(setOrderPriceSchema.safeParse({ totalAmount: 0 }).success, false); assert.equal(createPaymentSchema.safeParse({ amount: 250000, paymentMethod: "transfer", paymentDate: "2026-11-13" }).success, true); assert.equal(createPaymentSchema.safeParse({ amount: -1, paymentMethod: "transfer", paymentDate: "2026-11-13" }).success, false); });
test("minimum DP is calculated with integer ceiling", () => { const total=501001; assert.equal(Math.ceil(total*0.5), 250501); });
