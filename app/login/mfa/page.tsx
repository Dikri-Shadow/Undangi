import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin-auth";
export const metadata = { title: "Login Admin — UNDANGI", robots: { index: false, follow: false } };
export default async function LegacyMfaPage() { redirect((await getAdminUser()) ? "/admin" : "/login"); }
