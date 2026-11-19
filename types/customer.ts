export type CustomerRecipient = {
  id: string;
  guestName: string;
  createdAt?: string;
  updatedAt?: string;
  rsvpStatus?: "hadir" | "tidak" | "belum";
  guestCount?: number;
};

/** Returned only by create/rotate responses; never by list endpoints. */
export type CustomerRecipientCredential = CustomerRecipient & { token: string };

export type CustomerStats = {
  total: number;
  hadir: number;
  tidak: number;
  belum: number;
  totalGuests: number;
};

export type CustomerRecipientInput = { guestName: string };
