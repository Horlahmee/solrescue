import { NextResponse } from 'next/server';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { createServiceClient } from '@/lib/supabaseAdmin';
import { getRpcUrl } from '@/lib/solana';

const WITHDRAW_EXCESS_LAMPORTS = 38;
const SIGNATURE_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{64,88}$/;

// Lightweight per-instance IP throttle — a first line against floods. It does
// not span serverless instances (Vercel KV would); paired with the fee-wallet
// gate below, it makes abusing this endpoint pointless as well as slow.
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

// The client reports only a signature. Every figure recorded here is read
// back from the confirmed transaction on-chain — client numbers are never
// trusted (SPECS.md §3.3).
export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'rate limited' }, { status: 429 });
  }

  let signature: unknown;
  try {
    ({ signature } = await request.json());
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  if (typeof signature !== 'string' || !SIGNATURE_PATTERN.test(signature)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  const connection = new Connection(getRpcUrl(), 'confirmed');
  let tx;
  try {
    // A regex-valid base58 string can still be an invalid signature encoding
    // (wrong byte length), which makes the RPC throw — treat as a bad request.
    tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed',
    });
  } catch {
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }
  if (!tx || tx.meta === null || tx.meta.err !== null) {
    return NextResponse.json(
      { error: 'transaction not found or failed' },
      { status: 400 },
    );
  }

  const message = tx.transaction.message;
  // Recovery transactions are always v0 (built via compileToV0Message). A
  // legacy Message has no staticAccountKeys/compiledInstructions — reject it
  // rather than throw on undefined.
  if (!('staticAccountKeys' in message)) {
    return NextResponse.json(
      { error: 'not a recovery transaction' },
      { status: 400 },
    );
  }
  const keys = message.staticAccountKeys;
  const withdrawIx = message.compiledInstructions.find(
    (ix) =>
      keys[ix.programIdIndex].equals(TOKEN_PROGRAM_ID) &&
      ix.data.length === 1 &&
      ix.data[0] === WITHDRAW_EXCESS_LAMPORTS,
  );
  if (!withdrawIx || withdrawIx.accountKeyIndexes.length < 3) {
    return NextResponse.json(
      { error: 'not a recovery transaction' },
      { status: 400 },
    );
  }

  const mintIndex = withdrawIx.accountKeyIndexes[0];
  const recovered =
    BigInt(tx.meta.preBalances[mintIndex]) -
    BigInt(tx.meta.postBalances[mintIndex]);
  if (recovered <= 0n) {
    return NextResponse.json({ error: 'no lamports recovered' }, { status: 400 });
  }

  // Gate: a genuine SolRescue recovery always contains a SystemProgram.transfer
  // to OUR fee wallet (instruction 2, even when fee rounds to 0). Requiring it
  // stops unrelated historic opcode-38 transactions from being replayed here to
  // inflate the public "total recovered" stat. Fee amount is read from the
  // instruction data (u32 tag 2 + u64 lamports LE), not balance deltas.
  const feeWalletEnv = process.env.NEXT_PUBLIC_FEE_WALLET;
  if (!feeWalletEnv) {
    return NextResponse.json({ error: 'fee wallet not configured' }, { status: 500 });
  }
  const feeWallet = new PublicKey(feeWalletEnv);
  const transferIx = message.compiledInstructions.find(
    (ix) =>
      keys[ix.programIdIndex].equals(SystemProgram.programId) &&
      ix.data.length === 12 &&
      Buffer.from(ix.data).readUInt32LE(0) === 2 &&
      ix.accountKeyIndexes.length >= 2 &&
      keys[ix.accountKeyIndexes[1]].equals(feeWallet),
  );
  if (!transferIx) {
    return NextResponse.json(
      { error: 'not a SolRescue recovery transaction' },
      { status: 400 },
    );
  }
  const fee = Buffer.from(transferIx.data).readBigUInt64LE(4);

  const supabase = createServiceClient();
  const { error } = await supabase.from('recoveries').upsert(
    {
      tx_signature: signature,
      mint_address: keys[mintIndex].toBase58(),
      // Strings so Postgres int8 keeps full precision — never round-trip
      // lamports through a JS number (loses precision above 2^53).
      recovered_lamports: recovered.toString(),
      fee_lamports: fee.toString(),
    },
    { onConflict: 'tx_signature', ignoreDuplicates: true },
  );
  if (error) {
    console.error('recovery-logged insert failed:', error.message);
    return NextResponse.json({ error: 'storage failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
