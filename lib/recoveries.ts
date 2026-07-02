import { createAnonClient } from './supabaseClient';

const SIGNATURE_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{64,88}$/;

export interface RecoveryRow {
  tx_signature: string;
  mint_address: string;
  // int8 columns — PostgREST may return these as string or number; always
  // wrap with BigInt(String(x)) before math to avoid float precision loss.
  recovered_lamports: string | number;
  fee_lamports: string | number;
  created_at: string;
}

export function netLamports(row: RecoveryRow): bigint {
  return BigInt(String(row.recovered_lamports)) - BigInt(String(row.fee_lamports));
}

export async function getRecovery(sig: string): Promise<RecoveryRow | null> {
  if (!SIGNATURE_PATTERN.test(sig)) return null;
  try {
    const { data } = await createAnonClient()
      .from('recoveries')
      .select('*')
      .eq('tx_signature', sig)
      .maybeSingle();
    return (data as RecoveryRow) ?? null;
  } catch {
    return null;
  }
}
