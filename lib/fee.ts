export interface FeeSplit {
  fee: bigint;
  net: bigint;
}

// bigint division truncates toward zero, so the fee always rounds DOWN —
// dust rounding favors the user, and fee + net === excess exactly.
export function computeFeeSplit(excess: bigint, feeBps: number): FeeSplit {
  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > 10_000) {
    throw new RangeError(`feeBps must be an integer in [0, 10000], got ${feeBps}`);
  }
  if (excess <= 0n) {
    throw new RangeError(`excess must be positive, got ${excess}`);
  }
  const fee = (excess * BigInt(feeBps)) / 10_000n;
  return { fee, net: excess - fee };
}
