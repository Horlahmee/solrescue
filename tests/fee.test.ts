import { describe, expect, it } from 'vitest';
import { computeFeeSplit } from '../lib/fee';

describe('computeFeeSplit', () => {
  it('takes 10% at 1000 bps', () => {
    const { fee, net } = computeFeeSplit(100_000_000n, 1000);
    expect(fee).toBe(10_000_000n);
    expect(net).toBe(90_000_000n);
  });

  it('rounds the fee down, never up', () => {
    // 9 lamports at 10% → 0.9 → fee 0, user keeps all 9
    expect(computeFeeSplit(9n, 1000)).toEqual({ fee: 0n, net: 9n });
    // 19 lamports at 10% → 1.9 → fee 1
    expect(computeFeeSplit(19n, 1000)).toEqual({ fee: 1n, net: 18n });
  });

  it('fee + net always equals excess exactly', () => {
    for (const excess of [1n, 7n, 999n, 1_461_599n, 123_456_789_123n]) {
      const { fee, net } = computeFeeSplit(excess, 1000);
      expect(fee + net).toBe(excess);
    }
  });

  it('handles 0 bps and 10000 bps bounds', () => {
    expect(computeFeeSplit(1_000n, 0)).toEqual({ fee: 0n, net: 1_000n });
    expect(computeFeeSplit(1_000n, 10_000)).toEqual({ fee: 1_000n, net: 0n });
  });

  it('rejects invalid bps and non-positive excess', () => {
    expect(() => computeFeeSplit(1_000n, -1)).toThrow();
    expect(() => computeFeeSplit(1_000n, 10_001)).toThrow();
    expect(() => computeFeeSplit(1_000n, 12.5)).toThrow();
    expect(() => computeFeeSplit(0n, 1000)).toThrow();
    expect(() => computeFeeSplit(-5n, 1000)).toThrow();
  });
});
