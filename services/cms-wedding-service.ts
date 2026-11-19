import "server-only";
import { weddingConfig } from "@/data/wedding-config";
import { CmsUnavailableError } from "@/lib/supabase-env";
import { supabaseCmsAdapter } from "./adapters/supabase-cms-adapter";

export async function getPublishedWedding(slug: string) {
  try {
    const record = await supabaseCmsAdapter.getPublishedBySlug(slug);
    return record;
  } catch (error) {
    if (error instanceof CmsUnavailableError) return slug === weddingConfig.slug ? weddingConfig : null;
    throw error;
  }
}
