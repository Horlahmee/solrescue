import { PublicKey } from '@solana/web3.js';
import { notAMint } from './errors';

// Legacy SPL Token mint layout (82 bytes) — see SPECS.md §3.1.
export const MINT_SIZE = 82;

const AUTHORITY_TAG_OFFSET = 0;
const AUTHORITY_OFFSET = 4;
const SUPPLY_OFFSET = 36;
const DECIMALS_OFFSET = 44;
const IS_INITIALIZED_OFFSET = 45;

export interface ParsedMint {
  mintAuthority: PublicKey | null; // null = revoked
  supply: bigint;
  decimals: number;
  isInitialized: boolean;
}

export function parseMintAccount(data: Uint8Array): ParsedMint {
  if (data.length !== MINT_SIZE) {
    throw notAMint(`expected ${MINT_SIZE} bytes, got ${data.length}`);
  }
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  const authorityTag = view.getUint32(AUTHORITY_TAG_OFFSET, true);
  if (authorityTag !== 0 && authorityTag !== 1) {
    throw notAMint(`invalid mint-authority COption tag ${authorityTag}`);
  }

  return {
    mintAuthority:
      authorityTag === 1
        ? new PublicKey(data.subarray(AUTHORITY_OFFSET, AUTHORITY_OFFSET + 32))
        : null,
    supply: view.getBigUint64(SUPPLY_OFFSET, true),
    decimals: data[DECIMALS_OFFSET],
    isInitialized: data[IS_INITIALIZED_OFFSET] === 1,
  };
}
