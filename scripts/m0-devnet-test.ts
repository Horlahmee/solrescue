/**
 * M0 gate (SPECS.md §4): prove the withdraw_excess_lamports path end-to-end
 * on devnet — create mint → fund it → recover via buildRecoveryTx → assert
 * exact balances. Doubles as the integration test: `npm run test:devnet`.
 *
 * Signing: uses the Solana CLI's own devnet keypair file (created by
 * `solana-keygen new`, never by this codebase). DEVNET ONLY — the script
 * exits if NEXT_PUBLIC_CLUSTER is anything else, so this signer can never
 * touch mainnet funds.
 */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import {
  Connection,
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
import { buildRecoveryTx } from '../lib/recovery';
import { formatSol } from '../lib/formatSol';
import { MINT_SIZE } from '../lib/mintParser';
import { createConnection, getCluster } from '../lib/solana';

// tsx does not auto-load Next's env files; Node 21+ provides this natively.
process.loadEnvFile('.env.local');

const FUND_LAMPORTS = 100_000_000n; // 0.1 SOL sent to the mint = the "stuck" excess
const FEE_BPS = Number(process.env.FEE_BPS ?? 1000);
const SIGNATURE_FEE = 5_000n;

function loadCliKeypair(): Keypair {
  const path =
    process.env.SOLANA_KEYPAIR_PATH ??
    join(homedir(), '.config', 'solana', 'id.json');
  const secret = Uint8Array.from(JSON.parse(readFileSync(path, 'utf8')));
  return Keypair.fromSecretKey(secret);
}

function feeWalletOrTestFallback(): PublicKey {
  const configured = process.env.NEXT_PUBLIC_FEE_WALLET;
  if (configured) return new PublicKey(configured);
  // Off-curve system PDA: a valid transfer destination that requires no keypair.
  return PublicKey.findProgramAddressSync(
    [Buffer.from('solrescue-m0-fee')],
    SystemProgram.programId,
  )[0];
}

async function ensureFunds(connection: Connection, payer: PublicKey) {
  const balance = BigInt(await connection.getBalance(payer));
  console.log(`payer ${payer.toBase58()} balance: ${formatSol(balance)} SOL`);
  if (balance >= 500_000_000n) return;
  console.log('requesting 1 SOL devnet airdrop…');
  const sig = await connection.requestAirdrop(payer, 1_000_000_000);
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    signature: sig,
    blockhash,
    lastValidBlockHeight,
  });
}

async function createAndFundMint(
  connection: Connection,
  payer: Keypair,
): Promise<{ mint: PublicKey; rentMinimum: bigint }> {
  const seed = `solrescue-m0-${Date.now()}`;
  const mint = await PublicKey.createWithSeed(
    payer.publicKey,
    seed,
    TOKEN_PROGRAM_ID,
  );
  const rentMinimum = BigInt(
    await connection.getMinimumBalanceForRentExemption(MINT_SIZE),
  );

  const tx = new Transaction().add(
    SystemProgram.createAccountWithSeed({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint,
      basePubkey: payer.publicKey,
      seed,
      lamports: Number(rentMinimum),
      space: MINT_SIZE,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMint2Instruction(mint, 6, payer.publicKey, null),
    // The user mistake we exist to fix: SOL sent straight to a mint address.
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: mint,
      lamports: FUND_LAMPORTS,
    }),
  );
  const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
  console.log(`mint created + funded: ${mint.toBase58()} (tx ${sig})`);
  return { mint, rentMinimum };
}

function assertEq(label: string, actual: bigint, expected: bigint) {
  if (actual !== expected) {
    throw new Error(`ASSERT ${label}: expected ${expected}, got ${actual}`);
  }
  console.log(`  ✓ ${label} = ${actual}`);
}

async function main() {
  const cluster = getCluster();
  console.log(`cluster: ${cluster}`);
  if (cluster !== 'devnet') {
    throw new Error('m0-devnet-test only runs on devnet. Refusing.');
  }

  const connection = createConnection();
  const payer = loadCliKeypair();
  const feeWallet = feeWalletOrTestFallback();
  console.log(`fee wallet: ${feeWallet.toBase58()} (feeBps=${FEE_BPS})`);

  await ensureFunds(connection, payer.publicKey);
  const { mint, rentMinimum } = await createAndFundMint(connection, payer);

  const payerBefore = BigInt(await connection.getBalance(payer.publicKey));
  const feeWalletBefore = BigInt(await connection.getBalance(feeWallet));

  const { tx, excess, fee, net } = await buildRecoveryTx(
    connection,
    mint,
    payer.publicKey,
    feeWallet,
    FEE_BPS,
  );
  console.log(
    `quote: excess ${formatSol(excess)} · fee ${formatSol(fee)} · net ${formatSol(net)} SOL (simulation passed)`,
  );

  tx.sign([payer]);
  const signature = await connection.sendRawTransaction(tx.serialize());
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  });
  console.log(`recovery tx confirmed: ${signature}`);

  const payerAfter = BigInt(await connection.getBalance(payer.publicKey));
  const feeWalletAfter = BigInt(await connection.getBalance(feeWallet));
  const mintAfter = BigInt(await connection.getBalance(mint));

  console.log('assertions:');
  assertEq('excess', excess, FUND_LAMPORTS);
  assertEq('mint back at rent minimum', mintAfter, rentMinimum);
  assertEq('fee wallet received fee', feeWalletAfter - feeWalletBefore, fee);
  assertEq(
    'payer received net minus tx fee',
    payerAfter - payerBefore,
    net - SIGNATURE_FEE,
  );

  console.log(
    `\nM0 PASS — manual instruction (discriminator 38) works on ${cluster}.`,
  );
  console.log(`record in CLAUDE.md: manual path · ${cluster} · ${signature}`);
}

main().catch((error) => {
  console.error('\nM0 FAIL:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
