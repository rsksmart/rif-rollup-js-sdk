---
sidebarDepth: 4
---

# Accounts

<!-- Common links used alongside the file -->

[signer]: #signer
[batch builder]: #batch-builder
[set signing key transaction]: #changing-account-public-key
[additional Rootstock transaction]: #authorize-new-public-key-using-ethereum-transaction
[transfer]: #transfer-in-the-rif-rollup
[withdraw]: #withdraw-token-from-the-rif-rollup
[get_fee]: ../providers/#get-transaction-fee-from-the-server

<!-- Common footnotes -->

[^signer]: If undefined, `Signer` will be derived from Rootstock signature of specific message.
[^acc_id]: If undefined, it will be queried from the server.
[^ethsig]: If undefined, it will be deduced using the signature output.
[^undefined]: Returned `undefined` value means that the account does not exist in the state tree.
[^token]: "RBTC" or address of the ERC20 token
[^amount]: To see if amount is packable use [pack amount util](../utils/#closest-packable-amount)
[^fee]:

If not set, lowest possible fee will be requested from RIF Rollup server. Fees are paid in the same token as the main
transaction token. To get how to manually obtain an acceptable fee amount, see [Get transaction fee from the
server][get_fee]. To see if amount is packable use [pack fee util](../utils/#closest-packable-fee).

[^nonce]: If undefined, it will be queried from the server.
[^fast_fee]: If fee was requested manually, request has to be of "FastWithdraw" type
[^onchain_auth]:

When false, `ethers.Signer` is used to create signature, otherwise it is expected that user called
`onchainAuthSigningKey` to authorize new pubkey.

## Wallet

`Wallet` object is used to interact with the RIF Rollup network. The wallet has a Rootstock address associated with it and the
user that owns this Rootstock account owns a corresponding RIF Rollup account. By ownership of Rootstock account we mean
ability to send Rootstock transactions and optionally ability to sign messages.

Wallet has nonce associated with it and it is used to prevent transaction replay. Only transactions with the nonce that
is equal to the current nonce of the wallet can be executed.

To create transactions in the RIF Rollup network wallet must have RIF Rollup key pair associated with it. RIF Rollup keys are
handled by [Signer] object and can be created using different methods, the most convenient way is to create these keys
by deriving them from Rootstock signature of the specific message. This method is used by default if user does not
provide `Signer` created using some other method.

For RIF Rollup keys to be valid user should register them once in the RIF Rollup network using [set signing key transaction].
For Rootstock wallets that do not support message signing [additional Rootstock transaction] is required. RIF Rollup keys can
be changed at any time.

Transactions such as [Transfer] and [Withdraw] are additionally signed using Rootstock account of the wallet, this
signature is used for additional security in case RIF Rollup keys of the wallet are compromised. User is asked to sign
readable representation of the transaction and signature check is performed when transaction is submitted to RIF Rollup.

### Creating wallet from ETH signer

> Signature

```typescript
static async fromEthSigner(
  ethWallet: ethers.Signer,
  provider: Provider,
  signer?: Signer,
  accountId?: number,
  ethSignatureType?: EthSignerType
): Promise<Wallet>;
```

#### Inputs and outputs

| Name                        | Description                                                                             |
| --------------------------- | --------------------------------------------------------------------------------------- |
| ethWallet                   | `ethers.Signer` that corresponds to keys that own this account                          |
| provider                    | RIF Rollup provider that is used for submitting a transaction to the RIF Rollup network.|
| signer (optional)           | RIF Rollup signer that will be used for transaction signing.[^signer]                   |
| accountId (optional)        | RIF Rollup account id.[^acc_id]                                                         |
| ethSignatureType (optional) | Type of signature that is produced by `ethWallet`.[^ethsig]                             |
| returns                     | `rifRollup.Wallet` derived from Rootstock wallet (`ethers.Signer`)                      |

> Example

```typescript
import * as rifRollup from "rif-rollup-js-sdk";
import { ethers } from "ethers";

const ethersProvider = ethers.getDefaultProvider(network);
const syncProvider = await rifRollup.getDefaultProvider(network);

const ethWallet = ethers.Wallet.createRandom().connect(ethersProvider);
const syncWallet = await rifRollup.Wallet.fromEthSigner(ethWallet, syncProvider);
```

### Creating wallet from ETH without RIF Rollup signer

> Signature

```typescript
static async fromEthSignerNoKeys(
  ethWallet: ethers.Signer,
  provider: Provider,
  accountId?: number,
  ethSignatureType?: EthSignerType
): Promise<Wallet>;
```

This way wallet won't contain any valid RIF Rollup keys to perform transactions, but some of the operations can be used
without them, such as Deposit, Emergency exit and reading the account state.

#### Inputs and outputs

| Name                        | Description                                                                             |
| --------------------------- | --------------------------------------------------------------------------------------- |
| ethWallet                   | `ethers.Signer` that corresponds to keys that own this account                          |
| provider                    | RIF Rollup provider that is used for submitting a transaction to the RIF Rollup network.|
| accountId (optional)        | RIF Rollup account id.[^acc_id]                                                         |
| ethSignatureType (optional) | Type of signature that is produced by `ethWallet`.[^ethsig]                             |
| returns                     | `rifRollup.Wallet` derived from Rootstock wallet (`ethers.Signer`)                      |

> Example

```typescript
import * as rifRollup from "rif-rollup-js-sdk";
import { ethers } from "ethers";

const ethersProvider = ethers.getDefaultProvider(network);
const syncProvider = await rifRollup.getDefaultProvider(network);

const ethWallet = ethers.Wallet.createRandom().connect(ethersProvider);
const syncWallet = await rifRollup.Wallet.fromEthSignerNoKeys(ethWallet, syncProvider);
```

### Creating wallet from CREATE2 data

This way you can create a wallet, which corresponding L1 account could be created using the CREATE2 opcode. The
`syncSigner` pubKeyHash is encoded as a part of the salt for CREATE2. Note that you do not need to manually add it to
the `saltArg` of the `create2Data` as it is done automatically.

Such wallets are not required to provide Rootstock signatures for transactions. Unlike the `ECDSA` wallets, which have to
verify the signature for ChangePubKey onchain, `CREATE2` wallets only require to check that the pubKeyHash is included
in the CREATE2 digest. Thus, the ChangePubKey costs less for this kind of account than for the `ECDSA` one, but that
comes with a limitation: the L2 private key can not be changed. Also, this type of account can not be used to onboard
users from existing L1 addresses.

> Signature

```typescript
static async fromCreate2Data(
  syncSigner: Signer,
  provider: Provider,
  create2Data: Create2Data,
  accountId?: number
): Promise<Wallet>;
```

#### Inputs and outputs

| Name                 | Description                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------- |
| syncSigner           | RIF Rollup signer that will be used for transaction signing.[^signer]                    |
| provider             | RIF Rollup provider that is used for submitting a transaction to the RIF Rollup network. |
| create2Data          | Data out of which the CREATE2 algorithm would derive the address.                        |
| accountId (optional) | RIF Rollup account id.[^acc_id]                                                          |
| returns              | `rifRollup.Wallet` derived from Rootstock wallet (`ethers.Signer`)                       |

> Example

```typescript
import * as rifRollup from "rif-rollup-js-sdk";
import { ethers } from "ethers";

const syncProvider = await rifRollup.getDefaultProvider(network);
const signer = await rifRollup.Signer.fromSeed(ethers.utils.randomBytes(32));
const randomHex = (length: number) => {
  const bytes = ethers.utils.randomBytes(length);
  return ethers.utils.hexlify(bytes);
};
const create2Data = {
  creatorAddress: randomHex(20),
  saltArg: randomHex(32),
  codeHash: randomHex(32),
};
const syncWallet = await rifRollup.Wallet.fromCreate2Data(signer, syncProvider, create2Data);
```

### Creating wallet from L2 Wallets

Starting from `0.12.0` version of our SDK we support `remote json rpc signer`. That means you could add support of RIF Rollup L2 Wallets such as Argent RIF Rollup or other applications into your dapp. 

> ❗ Important: Currently only Argent Wallet supports this kind of signing.

```typescript
 static async fromEthSigner(
        web3Provider: ethers.providers.Web3Provider,
        provider: SyncProvider,
        accountId?: number
    ): Promise<RemoteWallet>
```

#### Inputs and outputs

| Name                 | Description                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------- |
| web3Provider         | A provider that is connected to an appropriate wallet, such as Argent RIF Rollup L2 Wallet. |
| provider             | RIF Rollup provider that is used for submitting a transaction to the RIF Rollup network.    |
| accountId (optional) | RIF Rollup account id.[^acc_id]                                                             |


### Get account state

Same as [Get account state from provider](../providers/#get-account-state-by-address) but gets state of this account.

> Signature

```typescript
async getAccountState(): Promise<AccountState>;
```

#### Inputs and outputs

| Name    | Description                 |
| ------- | --------------------------- |
| returns | State of the given account. |

### Get account id

For convenience it is possible to obtain the account ID.

> Signature

```typescript
async getAccountId(): Promise<number | undefined>;
```

#### Inputs and outputs

| Name    | Description                                                        |
| ------- | ------------------------------------------------------------------ |
| returns | Numerical account ID in the the RIF Rollup tree state.[^undefined] |

### Get account nonce

Get the nonce of this account. Very convenient if you want to either provide a nonce explicitly or use the last
committed one as the fallback.

> Signature

```typescript
async getNonce(nonce: Nonce = 'committed'): Promise<number>
```

#### Inputs and outputs

| Name    | Description                                                                                                                  |
| ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| nonce   | The type of nonce which should be returned.                                                                                  |
| returns | The last committed nonce if 'committed' is supplied and the value of the supplied `nonce` argument if the number is supplied |

### Get token balance on RIF Rollup

> Signature

```typescript
async getBalance(
  token: TokenLike,
  type: "committed" | "verified" = "committed"
): Promise<ethers.utils.BigNumber>;
```

#### Inputs and outputs

| Name    | Description                                                 |
| ------- | ----------------------------------------------------------- |
| token   | Token of interest, symbol or address of the supported token |
| type    | "committed" or "verified"                                   |
| returns | Balance of this token                                       |

> Example

```typescript
const wallet = ..; // setup wallet

// Get committed Rootstock balance.
const ethCommittedBalance = await getBalance("RBTC");

// Get verified ERC20 token balance.
const erc20VerifiedBalance = await getBalance("0xFab46E002BbF0b4509813474841E0716E6730136", "verified");
```

### Get token balance on Ethereum

Method similar to [`syncWallet.getBalance`](#get-token-balance-on-rif-rollup), used to query balance in the Ethereum
network.

> Signature

```typescript
async getEthereumBalance(token: TokenLike): Promise<utils.BigNumber>;
```

#### Inputs and outputs

| Name    | Description                                                 |
| ------- | ----------------------------------------------------------- |
| token   | Token of interest, symbol or address of the supported token |
| returns | Balance of this token                                       |

> Example

```typescript
import * as rifRollup from "rif-rollup-js-sdk";
import { ethers } from "ethers";

// Setup rifRollup.Wallet with ethers signer/wallet that is connected to ethers provider
const wallet = ..;

const ethOnChainBalance = await wallet.getEthereumBalance("RBTC");
```

### Unlocking ERC20 deposits

For convenience, it is possible to approve the maximum possible amount of ERC20 token deposits for the RIF Rollup contract
so that user would not need to approve each deposit.

> Signature

```typescript
async approveERC20TokenDeposits(
  token: TokenLike,
  max_erc20_approve_amount: BigNumber = MAX_ERC20_APPROVE_AMOUNT
): Promise<ethers.ContractTransaction>;
```

| Name                                | Description                                         |
| ----------------------------------- | --------------------------------------------------- |
| token                               | ERC20 token                                         |
| max_erc20_approve_amount (optional) | Amount of token to be unlocked. Infinite by default |
| returns                             | Handle for the Rootstock transaction.               |

> Signature

```typescript
async isERC20DepositsApproved(
  token: TokenLike,
  erc20ApproveThreshold: BigNumber = ERC20_APPROVE_TRESHOLD
): Promise<boolean>;
```

| Name                             | Description                                               |
| -------------------------------- | --------------------------------------------------------- |
| token                            | ERC20 token to be approved for deposits                   |
| erc20ApproveThreshold (optional) | The amount that needs to be approved. `2^255` by default. |
| returns                          | True if the token deposits are approved                   |

### Deposit token to Sync

Moves funds from the Rootstock account to the RIF Rollup account.

To do the ERC20 token transfer, this token transfer should be approved. User can make ERC20 deposits approved forever
using [unlocking ERC20 token], or the user can approve the exact amount (required for a deposit) upon each deposit, but
this is not recommended.

Once the operation is committed to the Rootstock network, we have to wait for a certain amount of confirmations (see
[provider docs] for exact number) before accepting it in the RIF Rollup network. After the transaction is committed to the
RIF Rollup network, funds are already usable by the recipient, meaning that there is no need to wait for verification before
proceeding unless additional confirmation is required for your application. To wait for the transaction commitment on
the RIF Rollup network, use `awaitReceipt`(see [utils]).

[unlocking erc20 token]: #unlocking-erc20-deposits
[provider docs]: ../providers/#get-amount-of-confirmations-required-for-priority-operations
[utils]: ../utils/#awaiting-for-operation-completion

> Signature

```typescript
async depositToSyncFromRootstock(deposit: {
    depositTo: Address;
    token: TokenLike;
    amount: BigNumberish;
    ethTxOptions?: ethers.providers.TransactionRequest;
    approveDepositAmountForERC20?: boolean;
  }
): Promise<ETHOperation>;
```

#### Inputs and outputs

| Name                                            | Description                                                        |
| ----------------------------------------------- | ------------------------------------------------------------------ |
| deposit.depositTo                               | RIF Rollup account address of the receiver                         |
| deposit.token                                   | Token to be transferred (symbol or address of the supported token) |
| deposit.amount                                  | Amount of token to be transferred                                  |
| deposit.ethTxOptions                            | Arguments for the deposit Rootstock transaction, e.g. gas price.   |
| deposit.approveDepositAmountForERC20 (optional) | See below\*                                                        |
| returns                                         | Handle for this transaction.                                       |

\*: If set, the user will be asked to approve the ERC20 token spending to our account (not required if
[token was unlocked](#unlocking-erc20-deposits))

> Example

```typescript
import * as rifRollup from "rif-rollup-js-sdk";
import { ethers } from "ethers";

const syncWallet = ..; // Setup RIF Rollup wallet from ethers.Signer.

const depositPriorityOperation = await syncWallet.depositToSyncFromRootstock({
  depositTo: "0x2d5bf7a3ab29f0ff424d738a83f9b0588bc9241e",
  token: "RBTC",
  amount: ethers.utils.parseEther("1.0"),
});

// Wait till priority operation is committed.
const priorityOpReceipt = await depositPriorityOperation.awaitReceipt();
```

### Changing account public key

In order to send RIF Rollup transactions (transfer and withdraw) user has to associate RIF Rollup key pair with account. Every
RIF Rollup account has address which is Rootstock address of the owner.

There are two ways to authorize RIF Rollup key pair.

1. Using Rootstock signature of specific message. This way is preferred but can only be used if your Rootstock wallet can
   sign messages.
2. Using Rootstock transaction to RIF Rollup smart-contract.

<aside class = notice>
The account should be present in the RIF Rollup network in order to set a signing key for it.
</aside>

This function will throw an error if the account is not present in the RIF Rollup network. Check the
[account id](#get-account-state) to see if account is present in the RIF Rollup state tree.

The operators require a fee to be paid in order to process transactions.[^fee]

> Signature

```typescript
async setSigningKey(changePubKey: {
    feeToken: TokenLike;
    ethAuthType: ChangePubkeyTypes;
    fee?: BigNumberish;
    nonce?: Nonce;
    validFrom?: number;
    validUntil?: number;
  }
): Promise<Transaction>;
```

#### Inputs and outputs

| Name                               | Description                                                                 |
| ---------------------------------- | --------------------------------------------------------------------------- |
| changePubKey.feeToken              | Token to pay fee in.[^token]                                                |
| changePubKey.ethAuthType           | The type which determines how will the Rootstock signature be verified.     |
| changePubKey.fee (optional)        | Amount of token to be paid as a fee for this transaction.[^fee]             |
| changePubKey.nonce (optional)      | Nonce that is going to be used for this transaction.[^nonce]                |
| changePubKey.validFrom (optional)  | Unix timestamp from which the block with this transaction can be processed  |
| changePubKey.validUntil (optional) | Unix timestamp until which the block with this transaction can be processed |
| returns                            | Handle of the submitted transaction.                                        |

> Example

```typescript
import { ethers } from "ethers";

const wallet = ..;// setup RIF Rollup wallet

if (!await wallet.isSigningKeySet()) {
  const changePubkey = await wallet.setSigningKey({
    feeToken: "FAU",
    fee: ethers.utils.parseEther("0.001"),
    ethAuthType: "ECDSA"
  });

  // Wait till transaction is committed
  const receipt = await changePubkey.awaitReceipt();
}
```

### Sign change account public key transaction

Signs [change public key](#changing-account-public-key) transaction without sending it to the RIF Rollup network. It is
important to consider transaction fee in advance because transaction can become invalid if token price changes.

> Signature

```typescript
async signSetSigningKey(changePubKey: {
  feeToken: TokenLike;
  fee: BigNumberish;
  nonce: number;
  ethAuthType: ChangePubkeyTypes;
  validFrom?: number;
  validUntil?: number;
}): Promise<SignedTransaction>;
```

#### Inputs and outputs

| Name                               | Description                                                                 |
| ---------------------------------- |-----------------------------------------------------------------------------| 
| changePubKey.feeToken              | Token to pay fee in.[^token]                                                |
| changePubKey.fee                   | Amount of token to be paid as a fee for this transaction.[^fee]             |
| changePubKey.nonce                 | Nonce that is going to be used for this transaction.[^nonce]                |
| changePubKey.ethAuthType           | The type which determines how will the Rootstock signature be verified.     | 
| changePubKey.validFrom (optional)  | Unix timestamp from which the block with this transaction can be processed  |
| changePubKey.validUntil (optional) | Unix timestamp until which the block with this transaction can be processed | 
| returns                            | Signed transaction                                                          |

### Authorize new public key using Rootstock transaction

This method is used to authorize [public key change](#changing-account-public-key) using Rootstock transaction for
wallets that don't support message signing.

> Signature

```typescript
async onchainAuthSigningKey(
  nonce: Nonce = "committed",
  ethTxOptions?: ethers.providers.TransactionRequest
): Promise<ContractTransaction>;
```

#### Inputs and outputs

| Name                    | Description                                                                    |
| ----------------------- | ------------------------------------------------------------------------------ |
| nonce                   | Nonce that is going to be used for `setSigningKey` transaction.[^nonce]        |
| ethTxOptions (optional) | Arguments for the onchain authentication Rootstock transaction, e.g. gas price.|
| returns                 | Handle of the submitted transaction                                            |

> Example

```typescript
import { ethers } from "ethers";

const wallet = ..;// setup RIF Rollup wallet

if (!await wallet.isSigningKeySet()) {
  const onchainAuthTransaction = await wallet.onchainAuthSigningKey();
  // Wait till transaction is committed on ethereum.
  await onchainAuthTransaction.wait();

  const changePubkey = await wallet.setSigningKey({
    feeToken: "RBTC",
    ethAuthType: "ECDSA"
  });

  // Wait till transaction is committed
  const receipt = await changePubkey.awaitReceipt();
}
```

### Check if current public key is set

Checks if current signer that is associated with wallet is able to sign transactions. See
[change pub key](#changing-account-public-key) on how to change current public key.

> Signature

```typescript
async isSigningKeySet(): Promise<boolean>;
```

#### Inputs and outputs

| Name    | Description                                                              |
| ------- | ------------------------------------------------------------------------ |
| returns | True if current signer that is assigned to wallet can sign transactions. |

### Transfer in the RIF Rollup

Moves funds between accounts inside the RIF Rollup network. Sender account should have correct public key set before sending
this transaction. ( see [change pub key](#changing-account-public-key))

Before sending this transaction, the user will be asked to sign a specific message with transaction details using their
Ethereum account (because of the security reasons).

After the transaction is committed, funds are already usable by the recipient, so there is no need to wait for
verification before proceeding unless additional confirmation is required for your application. To wait for transaction
commit use `awaitReceipt`(see [utils]).

The operators require a fee to be paid in order to process transactions.[^fee]

<aside class = notice>
The transfer amount and fee should have a limited number of significant digits according to spec.
See utils for helping with amounts packing.
</aside>

> Signature

```typescript
async syncTransfer(transfer:{
  to: Address;
  token: TokenLike;
  amount: BigNumberish;
  fee?: BigNumberish;
  nonce?: Nonce;
  validFrom?: number;
  validUntil?: number;
}): Promise<Transaction>;
```

#### Inputs and outputs

| Name                           | Description                                                                 |
| ------------------------------ | --------------------------------------------------------------------------- |
| transfer.to                    | RIF Rollup address of the recipient of funds                                |
| transfer.token                 | Token to be transferred[^token]                                             |
| transfer.amount                | Amount of token to be transferred.[^amount]                                 |
| transfer.fee (optional)        | Amount of token to be paid as a fee for this transaction.[^fee]             |
| transfer.nonce (optional)      | Nonce that is going to be used for this transaction.[^nonce]                |
| transfer.validFrom (optional)  | Unix timestamp from which the block with this transaction can be processed  |
| transfer.validUntil (optional) | Unix timestamp until which the block with this transaction can be processed |
| returns                        | Handle of the submitted transaction                                         |

> Example

```typescript
import { ethers } from "ethers";

const wallet = ..;// setup RIF Rollup wallet

const transferTransaction = await wallet.syncTransfer({
  to: "0x2d5bf7a3ab29f0ff424d738a83f9b0588bc9241e",
  token: "0xFab46E002BbF0b4509813474841E0716E6730136", // FAU ERC20 token address
  amount: ethers.utils.parseEther("1.0"),
  fee: ethers.utils.parseEther("0.001")
});

// Wait till transaction is committed
const transactionReceipt = await transferTransaction.awaitReceipt();
```

### Sign transfer in the RIF Rollup transaction

Signs [transfer](#transfer-in-the-rif-rollup) transaction without sending it to the RIF Rollup network. It is important to
consider transaction fee in advance because transaction can become invalid if token price changes.

> Signature

```typescript
async signSyncTransfer(transfer: {
  to: Address;
  token: TokenLike;
  amount: BigNumberish;
  fee: BigNumberish;
  nonce: number;
  validFrom?: number;
  validUntil?: number;
}): Promise<SignedTransaction>;
```

#### Inputs and outputs

| Name                           | Description                                                                 |
| ------------------------------ | --------------------------------------------------------------------------- |
| transfer.to                    | RIF Rollup address of the recipient of funds                                |
| transfer.token                 | Token to be transferred.[^token]                                            |
| transfer.amount                | Amount of token to be transferred.[^amount]                                 |
| transfer.fee                   | Amount of token to be paid as a fee for this transaction.[^fee]             |
| transfer.nonce                 | Nonce that is going to be used for this transaction.[^nonce]                |
| transfer.validFrom (optional)  | Unix timestamp from which the block with this transaction can be processed  |
| transfer.validUntil (optional) | Unix timestamp until which the block with this transaction can be processed |
| returns                        | Signed transaction.                                                         |

### Swaps in RIF Rollup

Performs an atomic swap between 2 existing accounts in the RIF Rollup network. For information about swaps, see the
[Swaps tutorial](/dev/swaps).

#### Signing orders

There are two kinds of orders:

- Swap order, where an explicit amount is set.
- Limit order, where an explicit amount is not set, and instead inferred from the balance. This order can be partially
  filled.

> Signature

```typescript
async getOrder(order:{
  tokenSell: TokenLike;
  tokenBuy: TokenLike;
  ratio: TokenRatio | WeiRatio;
  amount: BigNumberish;
  recipient?: Address;
  nonce?: Nonce;
  validFrom?: number;
  validUntil?: number;
}):Promise<Order>;

async getLimitOrder(order: {
  tokenSell: TokenLike;
  tokenBuy: TokenLike;
  ratio: TokenRatio | WeiRatio;
  recipient?: Address;
  nonce?: Nonce;
  validFrom?: number;
  validUntil?: number;
}): Promise<Order>;
```

#### Inputs and outputs

| Name                        | Description                                                                                     |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| order.tokenSell             | Token to be swapped                                                                             |
| order.tokenBuy              | Token to be swapped for                                                                         |
| order.ratio                 | An object that represents the sell:buy ratio; refer to [ratios](#ratios) for details            |
| order.amount                | Amount of token to be swapped[^amount]                                                          |
| order.recipient (optional)  | Address of the account to which the result of the swap should be transferred (defaults to self) |
| order.nonce (optional)      | Nonce that is going to be used for this transaction[^nonce]                                     |
| order.validFrom (optional)  | Unix timestamp from which the block with this transaction can be processed                      |
| order.validUntil (optional) | Unix timestamp until which the block with this transaction can be processed                     |
| returns                     | Handle of the submitted transaction                                                             |

#### Submitting a swap

Once two compatible signed swaps are collected, anyone can submit them.

> Signature

```typescript

async syncSwap(swap: {
  orders: [Order, Order];
  feeToken: TokenLike;
  amounts?: [BigNumberish, BigNumberish];
  nonce?: number;
  fee?: BigNumberish;
}): Promise<Transaction>;
```

#### Inputs and outputs

| Name                    | Description                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| swap.orders             | Signed orders, compatible with each other, that will constitute the swap                   |
| swap.feeToken           | Token to be used to pay fees                                                               |
| swap.amounts (optional) | Actual amounts to be swapped (defaults to amounts in orders, if they are not limit orders) |
| swap.fee (optional)     | Amount of token to be paid as a fee for this transaction.[^fee]                            |
| swap.nonce (optional)   | Nonce that is going to be used for this transaction.[^nonce]                               |
| returns                 | Handle of the submitted transaction                                                        |

#### Ratios

To construct a ratio, either `utils.tokenRatio` or `utils.weiRatio` may be used.

- `tokenRatio` constructs a ratio relevant to the tokens themselves, so `{ 'ETH': 4, 'wBTC': 1 }` would mean you want 4
  ETH for each wBTC.
- `weiRatio` constructs a ratio relevant to the _lowest denomination_ of the token, so `{ 'ETH': 4, 'wBTC': 1 }` would
  mean you want 4 wei (10<sup>-18</sup> ETH) for each satoshi ( 10<sup>-8</sup> wBTC).

> Signature

```typescript
function tokenRatio(ratio: { [token: string]: string | number; [token: number]: string | number }): TokenRatio;

function weiRatio(ratio: { [token: string]: BigNumberish; [token: number]: BigNumberish }): WeiRatio;
```

Only 2 tokens should be specified in each ratio.

#### Example

```typescript
const walletA = ..; // setup first wallet
const walletB = ..; // setup second wallet

const orderA = await walletA.getOrder({
  tokenSell: 'ETH',
  tokenBuy: 'USDT',
  amount: tokenSet.parseToken('ETH', '2'),
  ratio: utils.tokenRatio({
    ETH: 1,
    USDT: '4123.40',
  })
});

const orderB = await walletB.getOrder({
  tokenSell: 'USDT',
  tokenBuy: 'ETH',
  amount: tokenSet.parseToken('USDT', '8000'),
  ratio: utils.tokenRatio({
    ETH: 1,
    USDT: '4123.40',
  }),
  // this makes it a swap-and-transfer
  recipient: '0x2d5bf7a3ab29f0ff424d738a83f9b0588bc9241e'
});

const swap = await walletA.syncSwap({
  orders: [orderA, orderB],
  feeToken: 'ETH',
});

await swap.awaitReceipt();
```

### Batched Transfers in the RIF Rollup

Sends several transfers in a batch. For information about transaction batches, see the
[Providers section](../providers/#submit-transactions-batch).

Note that unlike in `syncTransfer`, the fee is a required field for each transaction, as in batch wallet cannot assume
anything about the fee for each individual transaction.

If it is required to send a batch that include transactions other than transfers, consider using Provider's
`submitTxsBatch` method instead.

> Signature

```typescript
async syncMultiTransfer(transfers: {
  to: Address;
  token: TokenLike;
  amount: BigNumberish;
  fee: BigNumberish;
  nonce?: Nonce;
  validFrom?: number;
  validUntil?: number;
}[]): Promise<Transaction[]>;
```

#### Inputs and outputs

| Name      | Description                                     |
| --------- | ----------------------------------------------- |
| transfers | An array of transfer transactions.              |
| returns   | Array of handle for each submitted transaction. |

For details on an individual transaction, see [Transfer in the RIF Rollup](#transfer-in-the-rif-rollup).

> Example

```typescript
import { ethers } from "ethers";

const wallet = ..;// setup RIF Rollup wallet

const transferA = {
  to: "0x2d5bf7a3ab29f0ff424d738a83f9b0588bc9241e",
  token: "0xFab46E002BbF0b4509813474841E0716E6730136", // FAU ERC20 token address
  amount: ethers.utils.parseEther("1.0"),
  fee: ethers.utils.parseEther("0.001")
};

const transferB = {
  to: "0xaabbf7a3ab29f0ff424d738a83f9b0588bc9241e",
  token: "0xFab46E002BbF0b4509813474841E0716E6730136", // FAU ERC20 token address
  amount: ethers.utils.parseEther("5.0"),
  fee: ethers.utils.parseEther("0.001")
}

const transferTransactions = await wallet.syncMultiTransfer([transferA, transferB]);
```

### Withdraw token from the RIF Rollup

Moves funds from the RIF Rollup account to Rootstock address. Sender account should have correct public key set before
sending this transaction. ( see [change pub key](#changing-account-public-key))

Before sending this transaction, the user will be asked to sign a specific message with transaction details using their
Ethereum account (because of the security reasons).

The operators require a fee to be paid in order to process transactions.[^fee]

The transaction has to be verified until funds are available on the Rootstock wallet balance so it is useful to use
`awaitVerifyReceipt`(see [utils]) before checking Rootstock balance.

> Signature

```typescript
async withdrawFromSyncToRootstock(withdraw: {
  ethAddress: string;
  token: TokenLike;
  amount: BigNumberish;
  fee?: BigNumberish;
  nonce?: Nonce;
  fastProcessing?: boolean;
  validFrom?: number;
  validUntil?: number;
}): Promise<Transaction>;
```

#### Inputs and outputs

| Name                               | Description                                                                               |
| ---------------------------------- | ----------------------------------------------------------------------------------------- |
| withdraw.ethAddress                | Rootstock address of the recipient                                                        |
| withdraw.token                     | Token to be transferred[^token].                                                          |
| withdraw.amount                    | Amount of token to be transferred[^amount].                                               |
| withdraw.fee (optional)            | amount of token to be paid as a fee for this transaction[^fee].                           |
| withdraw.nonce (optional)          | Nonce that is going to be used for this transaction[^nonce].                              |
| withdraw.fastProcessing (optional) | Request faster processing of transaction. Note that this requires a higher fee[^fast_fee] |
| withdraw.validFrom (optional)      | Unix timestamp from which the block with this transaction can be processed                |
| withdraw.validUntil (optional)     | Unix timestamp until which the block with this transaction can be processed               |
| returns                            | Handle of the submitted transaction                                                       |

> Example

```typescript
import { ethers } from "ethers";

const wallet = ..;// setup RIF Rollup wallet

const withdrawTransaction = await wallet.withdrawFromSyncToEthereum({
  ethAddress: "0x9de880ac69f3ed1e4d6870fcdabf07cbbed6f85c",
  token: "FAU",
  amount: ethers.utils.parseEther("1.0"),
  fee: ethers.utils.parseEther("0.001")
});

// Wait wait till transaction is verified
const transactionReceipt = await withdrawTransaction.awaitVerifyReceipt();
```

### Sign withdraw token from the RIF Rollup transaction

Signs [withdraw](#withdraw-token-from-the-rif-rollup) transaction without sending it to the RIF Rollup network. It is important
to consider transaction fee in advance because transaction can become invalid if token price changes.

> Signature

```typescript
async signWithdrawFromSyncToRootstock(withdraw: {
  ethAddress: string;
  token: TokenLike;
  amount: BigNumberish;
  fee: BigNumberish;
  nonce: number;
  validFrom?: number;
  validUntil?: number;
}): Promise<SignedTransaction>;
```

#### Inputs and outputs

| Name                           | Description                                                                 |
| ------------------------------ | --------------------------------------------------------------------------- |
| withdraw.ethAddress            | Rootstock address of the recipient                                          |
| withdraw.token                 | Token to be transferred[^token].                                            |
| withdraw.amount                | Amount of token to be transferred[^amount].                                 |
| withdraw.fee                   | amount of token to be paid as a fee for this transaction[^fee].             |
| withdraw.nonce                 | Nonce that is going to be used for this transaction[^nonce].                |
| withdraw.validFrom (optional)  | Unix timestamp from which the block with this transaction can be processed  |
| withdraw.validUntil (optional) | Unix timestamp until which the block with this transaction can be processed |
| returns                        | Signed transaction                                                          |

### Initiate a forced exit for an account

Initialize a forced withdraw of funds for an unowned account. Target account must not have a signing key set and must
exist more than 24 hours. After execution of the transaction, funds will be transferred from the target RIF Rollup wallet to
the corresponding Rootstock wallet. Transaction initiator pays fee for this transaction. All the balance of requested
token will be transferred.

Sender account should have correct public key set before sending this transaction. (see
[change pub key](#changing-account-public-key))

The operators require a fee to be paid in order to process transactions[^fee].

**Note:** fee is paid by the transaction initiator, not by the target account.

The transaction has to be verified until funds are available on the Rootstock wallet balance so it is useful to use
`awaitVerifyReceipt`(see [utils]) before checking Rootstock balance.

> Signature

```typescript
async syncForcedExit(forcedExit: {
  target: Address;
  token: TokenLike;
  fee?: BigNumberish;
  nonce?: Nonce;
  validFrom?: number;
  validUntil?: number;
}): Promise<Transaction>;
```

#### Inputs and outputs

| Name                             | Description                                                                 |
| -------------------------------- | --------------------------------------------------------------------------- |
| forcedExit.target                | Rootstock address of the target account.                                    |
| forcedExit.token                 | Token to be transferred[^token].                                            |
| forcedExit.fee (optional)        | Amount of token to be paid as a fee for this transaction[^fee].             |
| forcedExit.nonce (optional)      | Nonce that is going to be used for this transaction[^nonce].                |
| forcedExit.validFrom (optional)  | Unix timestamp from which the block with this transaction can be processed  |
| forcedExit.validUntil (optional) | Unix timestamp until which the block with this transaction can be processed |
| returns                          | Handle of the submitted transaction                                         |

> Example

```typescript
import { ethers } from "ethers";

const wallet = ..;// setup RIF Rollup wallet

const forcedExitTransaction = await wallet.syncForcedExit({
  target: "0x9de880ac69f3ed1e4d6870fcdabf07cbbed6f85c",
  token: "FAU",
  fee: ethers.utils.parseEther("0.001")
});

// Wait wait till transaction is verified
const transactionReceipt = await forcedExitTransaction.awaitVerifyReceipt();
```

### Sign a forced exit for an account transaction

Signs [forced exit](#initiate-a-forced-exit-for-an-account) transaction without sending it to the RIF Rollup network. It is
important to consider transaction fee in advance because transaction can become invalid if token price changes.

> Signature

```typescript
async signSyncForcedExit(forcedExit: {
  target: Address;
  token: TokenLike;
  fee: BigNumberish;
  nonce: number;
}): Promise<SignedTransaction>;
```

#### Inputs and outputs

| Name              | Description                                                     |
| ----------------- | --------------------------------------------------------------- |
| forcedExit.target | RIF Rollup address of the target account                        |
| forcedExit.token  | Token to be transferred[^token].                                |
| forcedExit.fee    | Amount of token to be paid as a fee for this transaction[^fee]. |
| forcedExit.nonce  | Nonce that is going to be used for this transaction[^nonce].    |
| returns           | Signed transaction                                              |

### Emergency withdraw from Sync

If ordinary withdraw from RIF Rollup account is ignored by network operators user could create an emergency withdraw request
using special Rootstock transaction, this withdraw request can't be ignored.

Moves the full amount of the given token from the RIF Rollup account to the Rootstock account.

Once the operation is committed to the Rootstock network, we have to wait for a certain amount of confirmations (see
[provider docs](../providers/#get-amount-of-confirmations-required-for-priority-operations) for exact number) before
accepting it in the RIF Rollup network. Operation will be processed within the RIF Rollup network as soon as the required amount
of confirmations is reached.

The transaction has to be verified until funds are available on the Rootstock wallet balance so it is useful to use
`awaitVerifyReceipt`(see [utils]) before checking Rootstock balance.

> Signature

```typescript
async emergencyWithdraw(withdraw: {
  token: TokenLike;
  accountId?: number;
  ethTxOptions?: ethers.providers.TransactionRequest;
}): Promise<ETHOperation>;
```

#### Inputs and outputs

| Name                             | Description                                                            |
| -------------------------------- | ---------------------------------------------------------------------- |
| withdraw.token                   | Token to be withdrawn[^token].                                         |
| withdraw.accountId (optional)    | Numerical id of the given account[^acc_id].                            |
| withdraw.ethTxOptions (optional) | arguments for emergency withdraw Rootstock transaction, e.g. gas price.|
| returns                          | Handle for this transaction.                                           |

> Example

```typescript
import * as rifRollup from "rif-rollup-js-sdk";
import { ethers } from "ethers";

const syncWallet = ..; // Setup RIF Rollup wallet.

const emergencyWithdrawPriorityOp = await syncWallet.emergencyWithdraw({
  token: "RBTC",
});

// Wait till priority operation is verified.
const priorityOpReceipt = await emergencyWithdrawPriorityOp.awaitVerifyReceipt();
```

### Toggle 2FA

Two factor authentification is an additional protection layer enforced by RIF Rollup server. You can read more about it
[here](/dev/payments/sending_transactions/#_2-factor-authentication).

```typescript
import * as rifRollup from "rif-rollup-js-sdk";
import { ethers } from "ethers";

const syncWallet = ..; // Setup RIF Rollup wallet with private key or EIP-1271 signing

await syncWallet.toggle2FA(false); // disable 2FA
await syncWallet.toggle2FA(true); // enable 2FA back
```

### Withdraw pending balance

Calls the `withdrawPendingBalance` function on the RIF Rollup smart contract. This function is typically used to withdraw
funds that got stuck due to out-of-gas error.

> Signature

```typescript
async withdrawPendingBalance(
  from: Address,
  token: TokenLike,
  amount?: BigNumberish
): Promise<ContractTransaction>;
```

#### Inputs and outputs

| Name              | Description                             |
| ----------------- | --------------------------------------- |
| from              | Rootstock address of the target account.|
| token             | Token to be withdrawn[^token]           |
| amount (optional) | Amount to withdraw[^amount]             |
| returns           | Handle for this transaction.            |

> Example

```typescript
import * as rifRollup from "rif-rollup-js-sdk";
import { ethers } from "ethers";

const syncWallet = ..; // Setup RIF Rollup wallet.

const withdrawPendingTx = await syncWallet.withdrawPendingBalance(
  "0x9de880ac69f3ed1e4d6870fcdabf07cbbed6f85c",
  "RBTC",
  ethers.utils.parseEther("0.001")
);

// Wait till the transaction is complete
const txReceipt = await withdrawPendingTx.wait();
```

### Withdraw pending balances

Calls the `withdrawPendingBalance` function multiple times on the RIF Rollup smart contract. To optimize gas usage, instead
of doing separate calls, it aggregates them using the [multicall](https://github.com/makerdao/multicall) smart contract.

> Signature

```typescript
async withdrawPendingBalances(
  addresses: Address[],
  tokens: TokenLike[],
  multicallParams: {
    address?: Address;
    network?: Network;
    gasLimit?: BigNumberish;
  },
  amounts?: BigNumberish[]
): Promise<ContractTransaction>;
```

#### Inputs and outputs

| Name               | Description                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------- |
| from               | Rootstock addresses of the target account.                                                    |
| tokens             | Tokens to be withdrawn[^token]                                                                |
| multicallParams    | The params of the call to the multicall smart contract. This is an advanced feature and it    |
|                    | is not recommended to set these values manually.                                              |
| amounts (optional) | Amounts to withdraw                                                                           |
| returns            | Handle for this transaction.                                                                  |

> Example

```typescript
import * as rifRollup from "rif-rollup-js-sdk";
import { ethers } from "ethers";

const syncWallet = ..; // Setup RIF Rollup wallet.

const withdrawPendingTx = await syncWallet.withdrawPendingBalances(
  ["0x9de880ac69f3ed1e4d6870fcdabf07cbbed6f85c", "0x2D9835a1C1662559975B00AEA00e326D1F9f13d0"],
  ["RBTC", "RIF"],
  {},
  [ethers.utils.parseEther("0.001"), ethers.utils.parseEther("0.002")]
);

// Wait till the transaction is complete
const txReceipt = await withdrawPendingTx.wait();
```

## Batch Builder

Batch Builder allows you to create and send transaction batches in a very straightforward way, without the need to worry
about managing nonce or the fee transaction. It also can improve the UX of your application as it requires the user to
sign the message only once for the whole batch. You can read more about transaction batches
[here](/dev/payments/sending_transactions/#sending-transaction-batches).

Batch Builder supports all kinds of RIF Rollup L2 transactions, such as: `Withdraw`, `Transfer`, `ChangePubKey`, etc.

All the methods of the Batch Builder are supposed to be called in a chained manner.

Note:

- _The user still has to sign a separate message for each `ChangePubKey` in the batch._
- _Currently, a batch is guaranteed to be able to successfully process a max of 50 transactions._

### Create Batch Builder

Creating Batch Builder

> Signature

```typescript
batchBuilder(nonce?: Nonce): BatchBuilder;
```

#### Inputs and outputs

| Name             | Description                                   |
| ---------------- | --------------------------------------------- |
| nonce (optional) | Starting nonce for the transactions [^nonce]. |
| returns          | Batch Builder instance.                       |

> Example

```typescript
const syncWallet = ..; // Setup RIF Rollup wallet.

const batchBuilder = syncWallet.batchBuilder();
```

### Add withdraw transaction

Adding withdraw transaction to the batch.

> Signature

```typescript
addWithdraw(withdraw: {
  ethAddress: string;
  token: TokenLike;
  amount: BigNumberish;
  fee?: BigNumberish;
  fastProcessing?: boolean;
  validFrom?: number;
  validUntil?: number;
}): BatchBuilder;
```

#### Inputs and outputs

| Name                               | Description                                                                               |
| ---------------------------------- | ----------------------------------------------------------------------------------------- |
| withdraw.ethAddress                | Rootstock address of the target.                                                          |
| withdraw.token                     | Token to be withdrawn[^token]                                                             |
| withdraw.amount                    | Amount to withdraw[^amount]                                                               |
| withdraw.fee (optional)            | Amount of token to be paid as a fee for this transaction[^fee]                            |
| withdraw.fastProcessing (optional) | Request faster processing of transaction. Note that this requires a higher fee[^fast_fee] |
| withdraw.validFrom (optional)      | Unix timestamp from which the block with this transaction can be processed                |
| withdraw.validUntil (optional)     | Unix timestamp until which the block with this transaction can be processed               |
| returns                            | Batch Builder instance.                                                                   |

> Example

```typescript
import { ethers } from "ethers";

const syncWallet = ..; // Setup RIF Rollup wallet.
const batchBuilder = ..; // Setup batch builder.

batchBuilder.addWithdraw({
  ethAddress: syncWallet.address(),
  token: "RBTC",
  amount: ethers.utils.parseEther("0.001")
});
```

### Add transfer transaction

Adding transfer transaction to the batch.

> Signature

```typescript
addTransfer(transfer: {
  to: Address;
  token: TokenLike;
  amount: BigNumberish;
  fee?: BigNumberish;
  validFrom?: number;
  validUntil?: number;
}): BatchBuilder;
```

#### Inputs and outputs

| Name                           | Description                                                                 |
| ------------------------------ | --------------------------------------------------------------------------- |
| transfer.to                    | RIF Rollup address of the recipient of funds.                               |
| transfer.token                 | Token to be transferred[^token]                                             |
| transfer.amount                | Amount of token to be transferred.[^amount]                                 |
| transfer.fee (optional)        | Amount of token to be paid as a fee for this transaction.[^fee]             |
| transfer.validFrom (optional)  | Unix timestamp from which the block with this transaction can be processed  |
| transfer.validUntil (optional) | Unix timestamp until which the block with this transaction can be processed |
| returns                        | Batch Builder instance.                                                     |

> Example

```typescript
import { ethers } from "ethers";

const batchBuilder = ..; // Setup batch builder.

batchBuilder.addTransfer({
  to: "0x2D9835a1C1662559975B00AEA00e326D1F9f13d0",
  token: "RBTC",
  amount: ethers.utils.parseEther("0.001")
});
```

### Add change pub key transaction

Adding change pub key transaction to the batch.

> Signature

```typescript
addChangePubKey(changePubKey:
  | {
      feeToken: TokenLike;
      ethAuthType: ChangePubkeyTypes;
      fee?: BigNumberish;
      validFrom?: number;
      validUntil?: number;
    }
  | SignedTransaction
): BatchBuilder;
```

#### Inputs and outputs

| Name                               | Description                                                                 |
| ---------------------------------- | --------------------------------------------------------------------------- |
| changePubKey.feeToken              | Token to pay fee in.[^token]                                                |
| changePubKey.ethAuthType           | The type which determines how will the Rootstock signature be verified.     |
| changePubKey.fee (optional)        | Amount of token to be paid as a fee for this transaction.[^fee]             |
| changePubKey.validFrom (optional)  | Unix timestamp from which the block with this transaction can be processed  |
| changePubKey.validUntil (optional) | Unix timestamp until which the block with this transaction can be processed |
| returns                            | Batch Builder instance.                                                     |

> Example

```typescript
const batchBuilder = ..; // Setup batch builder.

batchBuilder.addChangePubKey({
  feeToken: "RBTC",
  ethAuthType: 'ECDSA'
});
```

### Add forced exit transaction

Adding forced exit transaction to the batch.

> Signature

```typescript
addForcedExit(forcedExit: {
  target: Address;
  token: TokenLike;
  fee?: BigNumberish;
  validFrom?: number;
  validUntil?: number;
}): BatchBuilder;
```

#### Inputs and outputs

| Name                             | Description                                                                 |
| -------------------------------- | --------------------------------------------------------------------------- |
| forcedExit.target                | RIF Rollup address of the target account                                    |
| forcedExit.token                 | Token to be withdrawn[^token]                                               |
| forcedExit.fee (optional)        | Amount of token to be paid as a fee for this transaction.[^fee]             |
| forcedExit.validFrom (optional)  | Unix timestamp from which the block with this transaction can be processed  |
| forcedExit.validUntil (optional) | Unix timestamp until which the block with this transaction can be processed |
| returns                          | Batch Builder instance.                                                     |

> Example

```typescript
import { ethers } from "ethers";

const syncWallet = ..; // Setup RIF Rollup wallet.
const batchBuilder = ..; // Setup batch builder.

batchBuilder.addForcedExit({
  target: syncWallet.address(),
  token: "RBTC"
});
```

### Build batch

Construct the batch from the given transactions.

_If feeToken was provided, the fee for the whole batch will be obtained from the server in this token._

> Signature

```typescript
build(
  feeToken?: TokenLike;
): Promise<{ txs: SignedTransaction[]; signature: TxEthSignature; totalFee: TotalFee }>;
```

#### Inputs and outputs

| Name                | Description                                  |
| ------------------- | -------------------------------------------- |
| feeToken (optional) | Token to pay fee for in.[^token]             |
| returns             | Transactions, Rootstock signature, total fee.|

> Example

```typescript
import { ethers } from "ethers";

const syncWallet = ..; // Setup RIF Rollup wallet.
const batchBuilder = ..; // Setup batch builder.

batchBuilder.addForcedExit({
  target: syncWallet.address(),
  token: "RBTC"
});
batchBuilder.addTransfer({
  to: "0x2D9835a1C1662559975B00AEA00e326D1F9f13d0",
  token: "RBTC",
  amount: ethers.utils.parseEther("0.001")
});
await batchBuilder.build("RBTC");
```

## Signer

### Create from private key

> Signature

```typescript
static fromPrivateKey(pk: Uint8Array): Signer;
```

#### Inputs and outputs

| Name    | Description                       |
| ------- | --------------------------------- |
| pk      | private key                       |
| returns | `Signer` derived from private key |

### Create from seed

> Signature

```typescript
static async fromSeed(seed: Uint8Array): Promise<Signer>;
```

### Create from Rootstock signature

> Signature

```typescript
static async fromETHSignature(
  ethSigner: ethers.Signer
): Promise <{
  signer: Signer;
  ethSignatureType: EthSignerType;
}>;
```

#### Inputs and outputs

| Name      | Description                                                                  |
| --------- | ---------------------------------------------------------------------------- |
| ethSigner | Rootstock signer that is going to be used for signature generation.          |
| returns   | `Signer` derived from this seed and method that signer used to sign message. |

### Get public key hash

> Signature

```typescript
async pubKeyHash(): Promise<PubKeyHash>;
```

#### Inputs and outputs

| Name    | Description                                                                       |
| ------- | --------------------------------------------------------------------------------- |
| returns | Pubkey hash derived from corresponding public key. (`sync:` prefixed hex-encoded) |

### Sign sync transfer

Signs transfer transaction, the result can be submitted to the RIF Rollup network.

> Signature

```typescript
async signSyncTransfer(transfer: {
  accountId: number;
  from: Address;
  to: Address;
  tokenId: number;
  amount: ethers.BigNumberish;
  fee: ethers.BigNumberish;
  nonce: number;
}): Promise<Transfer>;
```

#### Inputs and outputs

| Name               | Description                             |
| ------------------ | --------------------------------------- |
| transfer.accountId | Account id of the sender                |
| transfer.from      | Address of the sender                   |
| transfer.to        | Address of the recipient                |
| transfer.tokenId   | Numerical token id                      |
| transfer.amount    | Amount to transfer, payed in token      |
| transfer.fee       | Fee to pay for transfer, payed in token |
| transfer.nonce     | Transaction nonce                       |
| returns            | Signed RIF Rollup transfer transaction  |

### Sign RIF Rollup Withdraw

Signs withdraw transaction, the result can be submitted to the RIF Rollup network.

> Signature

```typescript
async signSyncWithdraw(withdraw: {
  accountId: number;
  from: Address;
  ethAddress: string;
  tokenId: number;
  amount: ethers.BigNumberish;
  fee: ethers.BigNumberish;
  nonce: number;
}): Promise<Withdraw>;
```

#### Inputs and outputs

| Name                | Description                               |
| ------------------- | ----------------------------------------- |
| withdraw.accountId  | Account id of the sender                  |
| withdraw.from       | Account address of the sender             |
| withdraw.ethAddress | Rootstock address of the recipient        |
| withdraw.tokenId    | Numerical token id                        |
| withdraw.amount     | Amount to withdraw, paid in token         |
| withdraw.fee        | Fee to pay for withdrawing, paid in token |
| withdraw.nonce      | Transaction nonce                         |
| returns             | Signed RIF Rollup withdraw transaction    |

### Sign RIF Rollup Forced Exit

Signs forced exit transaction, the result can be submitted to the RIF Rollup network.

> Signature

```typescript
async signSyncForcedExit(forcedExit: {
  initiatorAccountId: number;
  target: Address;
  tokenId: number;
  fee: BigNumberish;
  nonce: number;
}): Promise<ForcedExit>;
```

#### Inputs and outputs

| Name                          | Description                               |
| ----------------------------- | ----------------------------------------- |
| forcedExit.initiatorAccountId | Account id of the sender                  |
| forcedExit.target             | Rootstock address of the target account   |
| forcedExit.tokenId            | Numerical token id                        |
| forcedExit.fee                | Fee to pay for withdrawing, paid in token |
| forcedExit.nonce              | Transaction nonce                         |
| returns                       | Signed RIF Rollup forced exit transaction |

### Sign RIF Rollup ChangePubKey

Signs ChangePubKey transaction, the result can be submitted to the RIF Rollup network.

> Signature

```typescript
async signSyncChangePubKey(changePubKey: {
  accountId: number;
  account: Address;
  newPkHash: PubKeyHash;
  feeTokenId: number;
  fee: BigNumberish;
  nonce: number;
  validFrom: number;
  validUntil: number;
  ethAuthData?: ChangePubKeyOnchain | ChangePubKeyECDSA | ChangePubKeyCREATE2;
  ethSignature?: string;
}): Promise<ChangePubKey>;
```

#### Inputs and outputs

| Name                                 | Description                                                                 |
| ------------------------------------ | --------------------------------------------------------------------------- |
| changePubKey.accountId               | Account id of the sender                                                    |
| changePubKey.account                 | RIF Rollup address of the account                                           |
| changePubKey.newPkHash               | Public key hash to be set for an account                                    |
| changePubKey.feeTokenId              | Numerical token id                                                          |
| changePubKey.fee                     | Fee to pay for operation, paid in token                                     |
| changePubKey.nonce                   | Transaction nonce                                                           |
| changePubKey.validFrom               | Unix timestamp from which the block with this transaction can be processed  |
| changePubKey.validUntil              | Unix timestamp until which the block with this transaction can be processed |
| changePubKey.ethAuthData (optional)  | Data which is used to verify the Rootstock signature                        |
| changePubKey.ethSignature (optional) |                                                                             |
| returns                              | Signed RIF Rollup change public key transaction                             |
