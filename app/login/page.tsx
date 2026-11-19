import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin-auth";
import { LoginForm } from "@/components/admin/login-form";
import { hashBootstrapToken } from "@/lib/admin-bootstrap";
import { supabaseAdminAdapter } from "@/services/adapters/supabase-admin-adapter";

export const metadata = { title: "Login Admin — UNDANGI", robots: { index: false, follow: false } };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ setup?: string }> }) {
  if (await getAdminUser()) redirect("/admin");
  const setupToken = (await searchParams).setup;
  const setupAllowed = Boolean(setupToken && !(await supabaseAdminAdapter.getSingleton().catch(() => null)) && await supabaseAdminAdapter.isBootstrapTokenValid(hashBootstrapToken(setupToken)).catch(() => false));
  const turnstileEnabled = process.env.NODE_ENV === "production" && Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  return <main className="grid min-h-screen place-items-center bg-[#FDF3F1] px-5"><section className="w-full max-w-md rounded-3xl border border-[#BF6D87]/10 bg-[#FDF3F1] p-7 shadow-[0_24px_70px_rgba(72,44,52,.1)] sm:p-10"><p className="text-xs font-bold tracking-[.28em] text-[#BF6D87]">UNDANGI</p><h1 className="font-blush-display mt-3 text-4xl text-[#482C34]">{setupAllowed ? "Buat Admin UNDANGI" : "Admin Login"}</h1><p className="mt-3 text-sm leading-6 text-[#6A565A]">{setupAllowed ? "Buat satu-satunya akun admin untuk mengelola UNDANGI." : "Masuk untuk mengelola undangan."}</p><LoginForm setupToken={setupAllowed ? setupToken : undefined} turnstileSiteKey={turnstileEnabled ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "" : ""} /></section></main>;
}
