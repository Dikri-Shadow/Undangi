import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";

export const adminEmailSchema = z.string().trim().email().max(160);
export const adminPasswordSchema = z.string()
  .min(14, "Password minimal 14 karakter.")
  .max(200)
  .regex(/[a-z]/, "Password harus memiliki huruf kecil.")
  .regex(/[A-Z]/, "Password harus memiliki huruf besar.")
  .regex(/[0-9]/, "Password harus memiliki angka.")
  .regex(/[^A-Za-z0-9]/, "Password harus memiliki simbol.");

export const adminLoginSchema = z.object({ email: adminEmailSchema, password: z.string().min(8).max(200), turnstileToken: z.string().min(1).max(4096) });
export const adminBootstrapSchema = z.object({
  email: adminEmailSchema,
  password: adminPasswordSchema,
  confirmPassword: z.string().max(200),
  setupToken: z.string().min(32).max(256),
  turnstileToken: z.string().min(1).max(4096),
}).refine((value) => value.password === value.confirmPassword, { path: ["confirmPassword"], message: "Konfirmasi password tidak sama." });

export const adminPasswordChangeSchema = z.object({
  password: adminPasswordSchema,
  confirmPassword: z.string().max(200),
}).refine((value) => value.password === value.confirmPassword, { path: ["confirmPassword"], message: "Konfirmasi password tidak sama." });

export function hashBootstrapToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function createBootstrapToken() {
  return randomBytes(32).toString("base64url");
}
