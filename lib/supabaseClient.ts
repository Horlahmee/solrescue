import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Anon client — read-only by RLS (mints + recoveries are select-only for anon).
export function createAnonClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not set');
  }
  return createClient(url, anonKey);
}

export interface MintRow {
  mint_address: string;
  authority: string | null;
  authority_revoked: boolean;
  lamports: number;
  excess_lamports: number;
  token_name: string | null;
  token_symbol: string | null;
}
