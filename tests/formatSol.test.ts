import { describe, expect, it } from 'vitest';
import { formatSol } from '../lib/formatSol';

describe('formatSol', () => {
  it('formats whole SOL', () => {
    expect(formatSol(1_000_000_000n)).toBe('1');
    expect(formatSol(25_000_000_000n)).toBe('25');
  });

  it('formats fractional SOL without trailing zeros', () => {
    expect(formatSol(100_000_000n)).toBe('0.1');
    expect(formatSol(1_461_600n)).toBe('0.0014616');
    expect(formatSol(1n)).toBe('0.000000001');
  });

  it('formats zero and negatives', () => {
    expect(formatSol(0n)).toBe('0');
    expect(formatSol(-90_000_000n)).toBe('-0.09');
  });
});
