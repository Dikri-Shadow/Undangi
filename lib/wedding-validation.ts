import { z } from "zod";
import { weddingConfig } from "@/data/wedding-config";
import { sanitizePlainText } from "@/lib/sanitize";

const id = z.string().uuid();
const rsvpShape = (maxGuests: number) => z.object({ weddingSlug: z.string().min(1).max(80), name: z.string().min(1).max(weddingConfig.rsvp.maxNameLength), recipientId: id.optional(), attendance: z.enum(["hadir", "tidak"]), guests: z.number().int().min(1).max(maxGuests), message: z.string().max(weddingConfig.rsvp.maxMessageLength).optional(), submissionId: id, startedAt: z.number().int().positive(), website: z.string().max(0).optional() }).transform((value) => ({ ...value, name: sanitizePlainText(value.name, weddingConfig.rsvp.maxNameLength), message: value.message ? sanitizePlainText(value.message, weddingConfig.rsvp.maxMessageLength) : undefined }));
export function rsvpSchemaForMaxGuests(maxGuests: number) { return rsvpShape(Math.max(1, Math.min(100, Math.floor(maxGuests || 4)))); }
export const rsvpSchema = rsvpSchemaForMaxGuests(weddingConfig.rsvp.maxGuests);
export const wishSchema = z.object({ weddingSlug: z.string().min(1).max(80), name: z.string().min(1).max(weddingConfig.wishes.maxNameLength), message: z.string().min(1).max(weddingConfig.wishes.maxMessageLength), submissionId: id, startedAt: z.number().int().positive(), website: z.string().max(0).optional() }).transform((value) => ({ ...value, name: sanitizePlainText(value.name, weddingConfig.wishes.maxNameLength), message: sanitizePlainText(value.message, weddingConfig.wishes.maxMessageLength) }));
export function isHumanTiming(startedAt: number, minimumMs: number) { return Date.now() - startedAt >= minimumMs && Date.now() - startedAt < 86_400_000; }
