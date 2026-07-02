import { Connection } from '@solana/web3.js';

export type Cluster = 'devnet' | 'mainnet-beta';

export function getCluster(): Cluster {
  const cluster = process.env.NEXT_PUBLIC_CLUSTER;
  if (cluster !== 'devnet' && cluster !== 'mainnet-beta') {
    throw new Error(
      `NEXT_PUBLIC_CLUSTER must be "devnet" or "mainnet-beta", got "${cluster ?? ''}"`,
    );
  }
  return cluster;
}

export function getRpcUrl(): string {
  const url = process.env.NEXT_PUBLIC_RPC_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_RPC_URL is not set');
  }
  return url;
}

export function createConnection(): Connection {
  return new Connection(getRpcUrl(), 'confirmed');
}
