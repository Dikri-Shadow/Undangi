import type { WeddingEvent } from "@/types/wedding";
const escapeIcs = (value: string) => value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
export function googleCalendarUrl(event: WeddingEvent, coupleDisplay: string) {
  const params = new URLSearchParams({ action: "TEMPLATE", text: `${event.title} — ${coupleDisplay}`, dates: `${event.calendar.start}/${event.calendar.end}`, details: event.calendar.description, location: `${event.venue}, ${event.address}` });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
export function downloadIcs(event: WeddingEvent, coupleDisplay: string, slug: string) {
  const body = ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//${escapeIcs(slug)}//Wedding//ID`, `X-WR-TIMEZONE:${event.calendar.timezone}`, "BEGIN:VEVENT", `UID:${crypto.randomUUID()}@${slug}`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`, `DTSTART:${event.calendar.start}`, `DTEND:${event.calendar.end}`, `SUMMARY:${escapeIcs(`${event.title} — ${coupleDisplay}`)}`, `DESCRIPTION:${escapeIcs(event.calendar.description)}`, `LOCATION:${escapeIcs(`${event.venue}, ${event.address}`)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/calendar;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${event.id}-${slug}.ics`; anchor.click(); URL.revokeObjectURL(url);
}
