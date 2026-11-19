import "server-only";
import { cache } from "react";
import { supabaseCmsAdapter } from "@/services/adapters/supabase-cms-adapter";

export const getAdminWedding = cache(async (id: string) => supabaseCmsAdapter.getById(id).catch(() => null));
