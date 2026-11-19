import test from "node:test";
import assert from "node:assert/strict";
import { calculateDiscount, calculateFinalAmount } from "@/lib/catalog-pricing";

test("percentage discount is bounded and never makes price negative", () => {
  assert.equal(calculateDiscount(100000, { type: "percentage", value: 20, minimumAmount: 0 }), 20000);
  assert.equal(calculateFinalAmount(100000, { type: "fixed", value: 150000, minimumAmount: 0 }), 0);
});
test("minimum purchase prevents discount", () => {
  assert.equal(calculateDiscount(99000, { type: "fixed", value: 10000, minimumAmount: 100000 }), 0);
});
test("invalid amount is rejected", () => { assert.throws(() => calculateFinalAmount(0)); });
