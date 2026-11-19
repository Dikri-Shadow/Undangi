import type { WeddingConfig } from "./wedding";

export type WeddingStatus = "draft" | "published";
export type WeddingRecord = {
  id: string;
  slug: string;
  status: WeddingStatus;
  brideName: string;
  brideFullName: string;
  groomName: string;
  groomFullName: string;
  weddingData: WeddingConfig;
  theme: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  deletedAt: string | null;
  updatedBy: string | null;
};

export type AdminWishRecord = {
  id: string;
  weddingSlug: string;
  guestName: string;
  message: string;
  createdAt: string;
  moderationStatus: "pending" | "approved" | "rejected";
};

export type AdminRsvpRecord = {
  id: string;
  weddingSlug: string;
  guestName: string;
  attendance: "hadir" | "tidak";
  guestCount: number;
  message: string | null;
  createdAt: string;
};
