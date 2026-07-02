import { createAnonClient } from './supabaseClient';

const SIGNATURE_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{64,88}$/;

export interface RecoveryRow {
  tx_signature: string;
  mint_address: string;
  recovered_lamports: number;
  fee_lamports: number;
  created_at: string;
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
