export type RecoveryErrorCode =
  | 'NOT_A_MINT'
  | 'AUTHORITY_REVOKED'
  | 'WRONG_AUTHORITY'
  | 'NO_EXCESS'
  | 'SIMULATION_FAILED';

export class RecoveryError extends Error {
  constructor(
    readonly code: RecoveryErrorCode,
    // Plain-English message safe to show in the UI — never a raw RPC string.
    readonly userMessage: string,
    readonly detail?: string,
  ) {
    super(`${code}: ${userMessage}${detail ? ` (${detail})` : ''}`);
    this.name = 'RecoveryError';
  }
}

export const notAMint = (detail?: string) =>
  new RecoveryError(
    'NOT_A_MINT',
    'This address is not a token mint account.',
    detail,
  );

export const authorityRevoked = () =>
  new RecoveryError(
    'AUTHORITY_REVOKED',
    'This mint’s authority has been revoked. Recovery would require the original mint keypair — we can’t help with this, and don’t trust anyone who asks you to paste it.',
  );

export const wrongAuthority = (expected: string) =>
  new RecoveryError(
    'WRONG_AUTHORITY',
    'Your connected wallet is not the authority of this mint.',
    `authority is ${expected}`,
  );

export const noExcess = () =>
  new RecoveryError(
    'NO_EXCESS',
    'This mint has no recoverable SOL above the rent-exempt minimum.',
  );

export const simulationFailed = (detail?: string) =>
  new RecoveryError(
    'SIMULATION_FAILED',
    'The recovery transaction failed simulation, so we blocked it. Nothing was sent.',
    detail,
  );
