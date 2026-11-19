export type RsvpReportRow = { id?: string; guestName: string; attendance: "hadir" | "tidak"; guestCount: number; message?: string | null; createdAt?: string };
export type RecipientReportRow = { id: string; guestName: string; rsvp: RsvpReportRow | null };

export function calculateRsvpStats(rows: RsvpReportRow[], recipients: RecipientReportRow[]) {
  const attached = recipients.flatMap((recipient) => recipient.rsvp ? [recipient.rsvp] : []);
  const attachedIds = new Set(attached.map((row) => row.id).filter(Boolean));
  const unattached = rows.filter((row) => !row.id || !attachedIds.has(row.id));
  const all = [...attached, ...unattached];
  const attending = all.filter((row) => row.attendance === "hadir");
  return { totalRecipients: recipients.length, responses: all.length, pending: recipients.filter((row) => row.rsvp === null).length, attending: attending.length, declined: all.length - attending.length, guests: attending.reduce((sum, row) => sum + row.guestCount, 0) };
}

export function csvEscape(value: string | number) {
  const text = String(value);
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function buildRsvpCsv(rows: RsvpReportRow[]) {
  const headers = ["Nama tamu", "Kehadiran", "Jumlah tamu", "Pesan tambahan", "Waktu pengiriman"];
  const values = rows.map((row) => [row.guestName, row.attendance === "hadir" ? "Hadir" : "Tidak hadir", row.guestCount, row.message || "", row.createdAt || ""]);
  return `\uFEFF${[headers, ...values].map((line) => line.map(csvEscape).join(",")).join("\r\n")}`;
}

/**
 * Per-recipient report CSV for the customer export: every recipient appears,
 * including those who have not responded yet ("Belum mengisi"). Same BOM /
 * quoting / formula-protection rules as buildRsvpCsv.
 */
export function buildRecipientReportCsv(recipients: RecipientReportRow[]) {
  const headers = ["Nama tamu", "Status RSVP", "Jumlah tamu", "Pesan tambahan", "Waktu pengiriman"];
  const values = recipients.map((recipient) => [
    recipient.guestName,
    recipient.rsvp ? (recipient.rsvp.attendance === "hadir" ? "Hadir" : "Tidak hadir") : "Belum mengisi",
    recipient.rsvp ? recipient.rsvp.guestCount : 0,
    recipient.rsvp?.message || "",
    recipient.rsvp?.createdAt || "",
  ]);
  return `\uFEFF${[headers, ...values].map((line) => line.map(csvEscape).join(",")).join("\r\n")}`;
}

export function buildWhatsAppReport(label: string, stats: ReturnType<typeof calculateRsvpStats>) {
  return `Laporan RSVP ${label}\nTotal tamu: ${stats.totalRecipients}\nSudah merespons: ${stats.responses}\nBelum merespons: ${stats.pending}\nHadir: ${stats.attending}\nTidak hadir: ${stats.declined}\nJumlah tamu hadir: ${stats.guests}`;
}
