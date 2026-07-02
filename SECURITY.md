# Security — what this app can and cannot do with your wallet

## What SolRescue CAN do

- **Read** your public key when you connect, to look up mints where you are the authority.
- **Propose** a transaction for you to sign. You see the exact simulated figures first, and your wallet shows its own preview. Nothing happens until you approve in your wallet.

## What SolRescue CANNOT do

- It cannot sign anything. Ever. Signing happens inside your wallet extension, on your machine.
- It cannot see, request, or receive your private key or seed phrase. There is no input field, API route, or code path for one — verify by searching this repository.
- It cannot move funds through our wallet. Recovered SOL goes from the mint account directly to your wallet. The fee is a separate instruction from your wallet to ours, in the same atomic transaction, at the exact amount shown.
- It cannot recover mints with a revoked authority. That requires the mint account's original keypair. We never accept keypairs — and you should treat anyone who asks for one as a thief.

## What signing the recovery transaction authorizes — exactly

Two instructions, nothing else:

1. `withdraw_excess_lamports` (SPL Token program, discriminator `38`): moves the excess lamports from the mint account to **your** wallet.
2. `SystemProgram.transfer`: moves the fee (10% of the excess, rounded down) from your wallet to the fee wallet.

If your wallet's transaction preview shows anything other than this, reject it and open an issue.

## Reporting a vulnerability

Open a GitHub issue for non-sensitive reports. For anything exploitable, use GitHub's private vulnerability reporting on this repository.
