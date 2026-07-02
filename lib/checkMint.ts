import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { MINT_SIZE, parseMintAccount } from './mintParser';

export type MintStatus =
  | { kind: 'recoverable'; authority: string; excess: bigint }
  | { kind: 'revoked' }
  | { kind: 'no-excess'; authority: string | null }
  | { kind: 'not-a-mint' };

// Manual checker: classify any pasted address, fresh from RPC.
export async function checkMint(
  connection: Connection,
  mint: PublicKey,
): Promise<MintStatus> {
  const info = await connection.getAccountInfo(mint, 'confirmed');
  if (
    !info ||
    !info.owner.equals(TOKEN_PROGRAM_ID) ||
    info.data.length !== MINT_SIZE
  ) {
    return { kind: 'not-a-mint' };
  }

  let parsed;
  try {
    parsed = parseMintAccount(info.data);
  } catch {
    return { kind: 'not-a-mint' };
  }
  if (!parsed.isInitialized) {
    return { kind: 'not-a-mint' };
  }

  const rentMinimum = BigInt(
    await connection.getMinimumBalanceForRentExemption(MINT_SIZE),
  );
  const excess = BigInt(info.lamports) - rentMinimum;

  if (parsed.mintAuthority === null) {
    // Revoked beats no-excess in messaging: recovery is impossible either way,
    // and the revoked warning carries the anti-drainer education.
    return { kind: 'revoked' };
  }
  if (excess <= 0n) {
    return { kind: 'no-excess', authority: parsed.mintAuthority.toBase58() };
  }
  return {
    kind: 'recoverable',
    authority: parsed.mintAuthority.toBase58(),
    excess,
  };
}
