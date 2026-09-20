import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

function isPlaceholder(value: string | undefined) {
  return (
    !value ||
    value.startsWith("__") ||
    value.endsWith("__") ||
    value.startsWith("PLACEHOLDER_")
  );
}

function isValidSupabaseUrl(value: string | undefined) {
  if (isPlaceholder(value)) return false;
  try {
    const url = new URL(value!);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export const supabaseConfigured =
  isValidSupabaseUrl(supabaseUrl) && !isPlaceholder(supabaseAnonKey);

if (import.meta.env.DEV && !supabaseConfigured) {
  console.error(
    "[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Configure them in the development environment before using Supabase-backed features.",
  );
}

type SupabaseGlobal = typeof globalThis & {
  __medmapSupabaseClient?: SupabaseClient;
};

const supabaseGlobal = globalThis as SupabaseGlobal;

export const supabase: SupabaseClient | null = supabaseConfigured
  ? (supabaseGlobal.__medmapSupabaseClient ??= createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }))
  : null;

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }

  return supabase;
}

export type SupabaseHealth = {
  configured: boolean;
  clientInitialized: boolean;
  backendQuery: "connected" | "failed" | "not_checked";
  error: string | null;
};

export async function getSupabaseHealth(): Promise<SupabaseHealth> {
  if (!supabase || !supabaseUrl || !supabaseAnonKey) {
    return {
      configured: false,
      clientInitialized: false,
      backendQuery: "not_checked",
      error: "Supabase environment variables are not configured.",
    };
  }

  try {
    await supabase.auth.getSession();
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      method: "GET",
      headers: {
        apikey: supabaseAnonKey,
      },
    });

    if (!response.ok) {
      return {
        configured: true,
        clientInitialized: true,
        backendQuery: "failed",
        error: `Supabase REST endpoint returned HTTP ${response.status}.`,
      };
    }

    return {
      configured: true,
      clientInitialized: true,
      backendQuery: "connected",
      error: null,
    };
  } catch {
    return {
      configured: true,
      clientInitialized: true,
      backendQuery: "failed",
      error: "Supabase could not be reached from the browser.",
    };
  }
}
