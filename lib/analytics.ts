import { track } from '@vercel/analytics';

// Funnel events — the sequence that tells us if the product converts.
// No wallet addresses or PII; mint address is public on-chain data.
export const analytics = {
  walletConnected: (wallet: string) => track('wallet_connected', { wallet }),
  mintChecked: (result: string) => track('mint_checked', { result }),
  recoverOpened: (mint: string) => track('recover_opened', { mint }),
  recoverSigned: (mint: string) => track('recover_signed', { mint }),
  recoverSucceeded: (mint: string, netSol: string) =>
    track('recover_succeeded', { mint, netSol }),
  recoverFailed: (reason: string) => track('recover_failed', { reason }),
  shareClicked: () => track('share_clicked'),
};
