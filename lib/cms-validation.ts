import { z } from "zod";
import { isSafeGoogleMapsEmbedUrl, isSafeGoogleMapsUrl } from "./maps";

export const slugSchema = z.string().trim().min(3).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug harus lowercase dan menggunakan tanda hubung.");
const mapEventSchema = z.object({ mapsUrl: z.string().refine((value) => !value || isSafeGoogleMapsUrl(value), "Google Maps URL tidak valid."), mapsEmbedUrl: z.string().optional().refine((value) => !value || isSafeGoogleMapsEmbedUrl(value), "Google Maps Embed URL tidak valid."), panoramaId: z.string().max(200).optional() }).passthrough();
const weddingDataSchema = z.object({ slug: slugSchema, couple: z.object({ first: z.string().trim().min(1).max(80), second: z.string().trim().min(1).max(80), display: z.string().trim().min(1).max(170) }), bride: z.object({ shortName: z.string().trim().max(80), childOrderLabel: z.string().trim().max(80).optional(), fullName: z.string().trim().min(1).max(160) }).passthrough(), groom: z.object({ shortName: z.string().trim().max(80), childOrderLabel: z.string().trim().max(80).optional(), fullName: z.string().trim().min(1).max(160) }).passthrough(), events: z.array(mapEventSchema).length(2) }).passthrough();
export const createWeddingSchema = z.object({ brideName: z.string().trim().min(1).max(80), groomName: z.string().trim().min(1).max(80), brideNickname: z.string().trim().max(80).optional(), groomNickname: z.string().trim().max(80).optional(), slug: slugSchema });
export const updateWeddingSchema = z.object({ status: z.enum(["draft", "published"]), weddingData: weddingDataSchema });
