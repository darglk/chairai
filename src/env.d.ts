/// <reference types="astro/client" />

import type { SupabaseClient } from "./db/supabase.client.ts";
import type { User } from "@supabase/supabase-js";
import type { UserRole } from "./types.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      user: (User & { role?: UserRole }) | null;
      userRole?: UserRole;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly GETSTREAM_API_KEY: string;
  readonly GETSTREAM_API_SECRET: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
