import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  authorityRevoked,
  noExcess,
  notAMint,
  simulationFailed,
  wrongAuthority,
} from './errors';
import { computeFeeSplit } from './fee';
import { MINT_SIZE, parseMintAccount } from './mintParser';

// withdraw_excess_lamports discriminator (SIMD-0266). Built manually because
// @solana/spl-token 0.4.x ships no helper for it — the enum entry is commented
// out in the package source. Verified 2026-07-02; see CLAUDE.md progress log.
const WITHDRAW_EXCESS_LAMPORTS = 38;

export interface RecoveryQuote {
  tx: VersionedTransaction;
  excess: bigint;
  fee: bigint;
  net: bigint;
}

function withdrawExcessLamportsInstruction(
  mint: PublicKey,
  destination: PublicKey,
  authority: PublicKey,
): TransactionInstruction {
  return new TransactionInstruction({
    programId: TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: mint, isSigner: false, isWritable: true },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: false },
    ],
    data: Buffer.from([WITHDRAW_EXCESS_LAMPORTS]),
  });
}

export async function buildRecoveryTx(
  connection: Connection,
  mint: PublicKey,
  authorityWallet: PublicKey,
  feeWallet: PublicKey,
  feeBps: number,
): Promise<RecoveryQuote> {
  // Always a fresh on-chain fetch — the database is discovery only.
  const info = await connection.getAccountInfo(mint, 'confirmed');
  if (!info) {
    throw notAMint('account does not exist');
  }
  if (!info.owner.equals(TOKEN_PROGRAM_ID)) {
    throw notAMint(`owned by ${info.owner.toBase58()}, not the token program`);
  }

  const parsed = parseMintAccount(info.data); // throws NOT_A_MINT unless 82 bytes
  if (!parsed.isInitialized) {
    throw notAMint('mint account is not initialized');
  }
  if (parsed.mintAuthority === null) {
    throw authorityRevoked();
  }
  if (!parsed.mintAuthority.equals(authorityWallet)) {
    throw wrongAuthority(parsed.mintAuthority.toBase58());
  }

  const rentMinimum = BigInt(
    await connection.getMinimumBalanceForRentExemption(MINT_SIZE),
  );
  const excess = BigInt(info.lamports) - rentMinimum;
  if (excess <= 0n) {
    throw noExcess();
  }

  const { fee, net } = computeFeeSplit(excess, feeBps);

  const instructions = [
    // Full excess goes mint → user; user funds never route through our wallet.
    withdrawExcessLamportsInstruction(mint, authorityWallet, authorityWallet),
    // Fee is a second instruction in the same transaction: atomic by construction.
    SystemProgram.transfer({
      fromPubkey: authorityWallet,
      toPubkey: feeWallet,
      lamports: fee,
    }),
  ];

  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  const tx = new VersionedTransaction(
    new TransactionMessage({
      payerKey: authorityWallet,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message(),
  );

  const simulation = await connection.simulateTransaction(tx, {
    sigVerify: false,
  });
  if (simulation.value.err) {
    throw simulationFailed(
      `${JSON.stringify(simulation.value.err)}; logs: ${(simulation.value.logs ?? []).join(' | ')}`,
    );
  }

  return { tx, excess, fee, net };
}
