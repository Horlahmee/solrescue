import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { createServiceClient } from '@/lib/supabaseAdmin';
import { getRpcUrl } from '@/lib/solana';

const WITHDRAW_EXCESS_LAMPORTS = 38;
const SIGNATURE_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{64,88}$/;

// The client reports only a signature. Every figure recorded here is read
// back from the confirmed transaction on-chain — client numbers are never
// trusted (SPECS.md §3.3).
export async function POST(request: Request) {
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
  const tx = await connection.getTransaction(signature, {
    maxSupportedTransactionVersion: 0,
    commitment: 'confirmed',
  });
  if (!tx || tx.meta === null || tx.meta.err !== null) {
    return NextResponse.json(
      { error: 'transaction not found or failed' },
      { status: 400 },
    );
  }

  const message = tx.transaction.message;
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

  const feeWalletEnv = process.env.NEXT_PUBLIC_FEE_WALLET;
  let fee = 0n;
  if (feeWalletEnv) {
    const feeWallet = new PublicKey(feeWalletEnv);
    const feeIndex = keys.findIndex((key) => key.equals(feeWallet));
    if (feeIndex >= 0) {
      fee =
        BigInt(tx.meta.postBalances[feeIndex]) -
        BigInt(tx.meta.preBalances[feeIndex]);
    }
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from('recoveries').upsert(
    {
      tx_signature: signature,
      mint_address: keys[mintIndex].toBase58(),
      recovered_lamports: Number(recovered),
      fee_lamports: Number(fee),
    },
    { onConflict: 'tx_signature', ignoreDuplicates: true },
  );
  if (error) {
    console.error('recovery-logged insert failed:', error.message);
    return NextResponse.json({ error: 'storage failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
