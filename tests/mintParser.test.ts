import { describe, expect, it } from 'vitest';
import { PublicKey } from '@solana/web3.js';
import { MINT_SIZE, parseMintAccount } from '../lib/mintParser';
import { RecoveryError } from '../lib/errors';

const AUTHORITY = new PublicKey('J3dxNj7nDRRqRRXuEMynDG57DkZK4jYRuv3Garmb1i99');

function mintFixture({
  authority,
  supply = 0n,
  decimals = 6,
  isInitialized = true,
}: {
  authority: PublicKey | null;
  supply?: bigint;
  decimals?: number;
  isInitialized?: boolean;
}): Uint8Array {
  const data = new Uint8Array(MINT_SIZE);
  const view = new DataView(data.buffer);
  if (authority) {
    view.setUint32(0, 1, true);
    data.set(authority.toBytes(), 4);
  }
  view.setBigUint64(36, supply, true);
  data[44] = decimals;
  data[45] = isInitialized ? 1 : 0;
  return data;
}

describe('parseMintAccount', () => {
  it('parses a mint with an active authority', () => {
    const parsed = parseMintAccount(
      mintFixture({ authority: AUTHORITY, supply: 1_000_000n, decimals: 9 }),
    );
    expect(parsed.mintAuthority?.equals(AUTHORITY)).toBe(true);
    expect(parsed.supply).toBe(1_000_000n);
    expect(parsed.decimals).toBe(9);
    expect(parsed.isInitialized).toBe(true);
  });

  it('parses a mint with a revoked authority as null', () => {
    const parsed = parseMintAccount(mintFixture({ authority: null }));
    expect(parsed.mintAuthority).toBeNull();
  });

  it('rejects data that is not exactly 82 bytes', () => {
    expect(() => parseMintAccount(new Uint8Array(81))).toThrowError(RecoveryError);
    expect(() => parseMintAccount(new Uint8Array(165))).toThrowError(RecoveryError);
    expect(() => parseMintAccount(new Uint8Array(0))).toThrowError(RecoveryError);
  });

  it('rejects an invalid COption tag', () => {
    const data = mintFixture({ authority: AUTHORITY });
    new DataView(data.buffer).setUint32(0, 7, true);
    expect(() => parseMintAccount(data)).toThrowError(RecoveryError);
  });

  it('reports an uninitialized mint', () => {
    const parsed = parseMintAccount(
      mintFixture({ authority: AUTHORITY, isInitialized: false }),
    );
    expect(parsed.isInitialized).toBe(false);
  });
});
