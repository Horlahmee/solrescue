import { createAnonClient } from '@/lib/supabaseClient';

export interface LandingStats {
  total_recoverable_lamports: number;
  recoverable_mints: number;
  total_recovered_lamports: number;
  total_recoveries: number;
}

export interface LeaderboardRow {
  mint_address: string;
  authority: string | null;
  excess_lamports: number;
  token_name: string | null;
  token_symbol: string | null;
}

const EMPTY_STATS: LandingStats = {
  total_recoverable_lamports: 0,
  recoverable_mints: 0,
  total_recovered_lamports: 0,
  total_recoveries: 0,
};

export async function fetchLandingStats(): Promise<LandingStats> {
  try {
    const { data } = await createAnonClient().from('stats').select('*').single();
    return (data as LandingStats) ?? EMPTY_STATS;
  } catch {
    return EMPTY_STATS; // the landing page must render even if the DB is down
  }
}

export const LEADERBOARD_LIMIT = 25;

export async function fetchLeaderboard(
  limit: number = LEADERBOARD_LIMIT,
): Promise<LeaderboardRow[]> {
  try {
    const { data } = await createAnonClient()
      .from('mints')
      .select('mint_address, authority, excess_lamports, token_name, token_symbol')
      .eq('authority_revoked', false)
      .gt('excess_lamports', 0)
      .order('excess_lamports', { ascending: false })
      .limit(limit);
    return (data as LeaderboardRow[]) ?? [];
  } catch {
    return [];
  }
}
