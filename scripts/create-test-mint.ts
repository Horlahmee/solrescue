/**
 * DEVNET ONLY: create a test mint owned by a given authority and "accidentally"
 * fund it with 0.1 SOL, so the M2 UI flow can be exercised end-to-end with a
 * real wallet. Payer is the Solana CLI's own devnet keypair.
 *
 * Usage: npx tsx scripts/create-test-mint.ts <authority-pubkey>
 */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  createInitializeMint2Instruction,
} from '@solana/spl-token';
import { MINT_SIZE } from '../lib/mintParser';
import { createConnection, getCluster } from '../lib/solana';

process.loadEnvFile('.env.local');

const FUND_LAMPORTS = 100_000_000; // 0.1 SOL of "stuck" excess

function loadCliKeypair(): Keypair {
  const path =
    process.env.SOLANA_KEYPAIR_PATH ??
    join(homedir(), '.config', 'solana', 'id.json');
  return Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(readFileSync(path, 'utf8'))),
  );
}

async function main() {
  if (getCluster() !== 'devnet') {
    throw new Error('create-test-mint only runs on devnet. Refusing.');
  }
  const authorityArg = process.argv[2];
  if (!authorityArg) {
    throw new Error('usage: npx tsx scripts/create-test-mint.ts <authority-pubkey>');
  }
  const authority = new PublicKey(authorityArg);

  const connection = createConnection();
  const payer = loadCliKeypair();
  const seed = `solrescue-test-${Date.now()}`;
  const mint = await PublicKey.createWithSeed(
    payer.publicKey,
    seed,
    TOKEN_PROGRAM_ID,
  );
  const rentMinimum = await connection.getMinimumBalanceForRentExemption(
    MINT_SIZE,
  );

  const tx = new Transaction().add(
    SystemProgram.createAccountWithSeed({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint,
      basePubkey: payer.publicKey,
      seed,
      lamports: rentMinimum,
      space: MINT_SIZE,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMint2Instruction(mint, 6, authority, null),
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: mint,
      lamports: FUND_LAMPORTS,
    }),
  );
  const signature = await sendAndConfirmTransaction(connection, tx, [payer]);
  console.log(`devnet test mint: ${mint.toBase58()}`);
  console.log(`authority: ${authority.toBase58()}`);
  console.log(`stuck excess: 0.1 SOL · tx: ${signature}`);
}

main().catch((error) => {
  console.error('failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
