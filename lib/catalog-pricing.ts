export type Discount = { type: "percentage" | "fixed"; value: number; minimumAmount: number };
export type PriceSnapshot = { themeId: string; themeName: string; packageId: string; packageName: string; normalAmount: number; discountId?: string; discountName?: string; discountCode?: string; discountType?: Discount["type"]; discountValue?: number; finalAmount: number; calculatedAt: string };

export function calculateDiscount(amount: number, discount?: Discount) {
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("Harga tidak valid");
  if (!discount || amount < discount.minimumAmount) return 0;
  const value = discount.type === "percentage" ? Math.floor(amount * discount.value / 100) : discount.value;
  return Math.min(amount, Math.max(0, Math.floor(value)));
}

export function calculateFinalAmount(amount: number, discount?: Discount) { return amount - calculateDiscount(amount, discount); }
