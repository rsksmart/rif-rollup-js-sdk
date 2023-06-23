# Getting started

In this tutorial we will demonstrate how to:

1. Connect to the RIF Rollup network.
1. Deposit assets from Rootstock into RIF Rollup.
1. Make transfers.
1. Withdraw funds back to Rootstock mainnet.

## Adding dependencies

```bash
yarn add rif-rollup-js-sdk
yarn add ethers # ethers is a peer dependency of rif-rollup-js-sdk
```

See [Appendix A](../browser-bundled) for how to add library to web project directly from
[https://unpkg.com](https://unpkg.com) CDN.

## Adding imports

You can import all the content of the RIF Rollup library with the following statement:

```typescript
import * as rifRollup from 'rif-rollup-js-sdk';
```

Note, that it is not actually required to import all of the library. For instance, if you only need the Wallet class,
you can safely do

```typescript
import { Wallet } from 'rif-rollup-js-sdk';
```

But in the rest of the book we will assume that the library was imported the first way to differentiate content imported
from the RIF Rollup and ethers libraries.

## Connecting to RIF Rollup network

To interact with RIF Rollup network users need to know the endpoint of the operator node.

```typescript
const syncProvider = await rifRollup.getDefaultProvider('testnet');
```

Most operations require some read-only access to the Rootstock network. We use `ethers` library to interact with
Rootstock.

```typescript
const ethersProvider = ethers.getDefaultProvider('testnet');
```

## Creating a Wallet

To control your account in RIF Rollup, use the `rifRollup.Wallet` object. It can sign transactions with keys stored in
`rifRollup.Signer` and send transaction to RIF Rollup network using `rifRollup.Provider`.

`rifRollup.Wallet` is a wrapper around 2 objects:

- `ethers.Signer` to sign Rootstock transactions.
- `rifRollup.Signer` to sign native RIF Rollup transactions.

The private key used by `rifRollup.Signer` is implicitly derived from Rootstock signature of a special message.

```typescript
// Create rootstock wallet using ethers.js
const rbtcWallet = ethers.Wallet.fromMnemonic(MNEMONIC).connect(ethersProvider);

// Derive rifRollup.Signer from rootstock wallet.
const syncWallet = await rifRollup.Wallet.fromEthSigner(rbtcWallet, syncProvider);
```

## Depositing assets from Rootstock into RIF Rollup

We are going to deposit `1.0 RBTC` to our RIF Rollup account.

```typescript
const deposit = await syncWallet.depositToSyncFromRootstock({
  depositTo: syncWallet.address(),
  token: 'RBTC',
  amount: ethers.utils.parseEther('1.0')
});
```

"RBTC" stands for native RBTC. To transfer supported ERC20 token use ERC20 address or ERC20 symbol instead of "RBTC".

After the tx is submitted to the Rootstock node, we can track its status using the returned object:

```typescript
// Await confirmation from the RIF Rollup operator
// Completes when a promise is issued to process the tx
const depositReceipt = await deposit.awaitReceipt();

// Await verification
// Completes when the tx reaches finality on Rootstock
const depositReceipt = await deposit.awaitVerifyReceipt();
```

## Unlocking RIF Rollup account

To control assets in RIF Rollup network, an account must register a separate public key once.

```typescript
if (!(await syncWallet.isSigningKeySet())) {
  if ((await syncWallet.getAccountId()) == undefined) {
    throw new Error('Unknown account');
  }

  // As any other kind of transaction, `ChangePubKey` transaction requires fee.
  // User doesn't have (but can) to specify the fee amount. If omitted, library will query RIF Rollup node for
  // the lowest possible amount.
  const changePubkey = await syncWallet.setSigningKey({
    feeToken: 'RBTC',
    ethAuthType: 'ECDSA'
  });

  // Wait until the tx is committed
  await changePubkey.awaitReceipt();
}
```

## Checking RIF Rollup account balance

```typescript
// Committed state is not final yet
const committedRBTCBalance = await syncWallet.getBalance('RBTC');

// Verified state is final
const verifiedRBTCBalance = await syncWallet.getBalance('RBTC', 'verified');
```

To list all tokens of this account at once, use `getAccountState`:

```typescript
const state = await syncWallet.getAccountState();

const committedBalances = state.committed.balances;
const committedRBTCBalance = committedBalances['RBTC'];

const verifiedBalances = state.verified.balances;
const committedRBTCBalance = verifiedBalances['RBTC'];
```

## Making a transfer in RIF Rollup

Now, let's create a second wallet and transfer some funds into it. Note that we can send assets to any fresh Rootstock
account, without preliminary registration!

```typescript
const rbtcWallet2 = ethers.Wallet.fromMnemonic(MNEMONIC2).connect(ethersProvider);
const syncWallet2 = await rifRollup.SyncWallet.fromEthSigner(rbtcWallet2, syncProvider);
```

We are going to transfer `0.999 RBTC` to another account and pay `0.001 RBTC` as a fee to the operator (RIF Rollup account
balance of the sender is going to be decreased by `0.999 + 0.001 RBTC`). The use of `closestPackableTransactionAmount()`
and `closestPackableTransactionFee()` is necessary because the precision of transfer in RIF Rollup is limited (see docs
below).

```typescript
const amount = rifRollup.utils.closestPackableTransactionAmount(ethers.utils.parseEther('0.999'));
const fee = rifRollup.utils.closestPackableTransactionFee(ethers.utils.parseEther('0.001'));

const transfer = await syncWallet.syncTransfer({
  to: syncWallet2.address(),
  token: 'RBTC',
  amount,
  fee
});
```

Note that setting fee manually is not required. If `fee` field is omitted, SDK will choose the lowest possible fee
acceptable by server:

```typescript
const amount = rifRollup.utils.closestPackableTransactionAmount(ethers.utils.parseEther('0.999'));

const transfer = await syncWallet.syncTransfer({
  to: syncWallet2.address(),
  token: 'RBTC',
  amount
});
```

To track the status of this transaction:

```typescript
const transferReceipt = await transfer.awaitReceipt();
```

## Withdrawing funds back to Rootstock

```typescript
const withdraw = await syncWallet2.withdrawFromSyncToRootstock({
  ethAddress: rbtcWallet2.address,
  token: 'RBTC',
  amount: ethers.utils.parseEther('0.998')
});
```

Assets will be withdrawn to the target wallet after the zero-knowledge proof of RIF Rollup block with this operation is
generated and verified by the mainnet contract.

We can wait until ZKP verification is complete:

```typescript
await withdraw.awaitVerifyReceipt();
```
