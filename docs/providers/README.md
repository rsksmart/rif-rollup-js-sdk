---
sidebarDepth: 4
---

# Providers

JSON-RPC protocol is used to communicate with RIF Rollup network nodes. `Provider` is used to abstract details of the
communication and provides useful API for interaction with RIF Rollup network.

We support HTTP and WebSocket transport protocols for JSON-RPC communications. Even though WebSocket transport supports
subscriptions, HTTP transport is preferred due to its stability. `HTTPTransport` and `WSTransport` classes are used to
implement details of communication, but usually, you don't need to deal with these objects directly.

::: warning

Websocket support will be removed soon due to its instability.

:::

## RIF Rollup provider

### Get default provider for network

```typescript
import * as rifRollup from 'rif-rollup-js-sdk';

const syncHttpProvider = await rifRollup.getDefaultProvider(network);
```

where

```typescript
network = 'localhost' | 'testnet' | 'mainnet';
```

Used to connect to the common endpoint for the given network over HTTP transport.

### Create WebSocket provider (it is deprecated and will be removed soon)

> Creating provider over WebSocket transport. This call will create WS connection that should be closed.

```typescript
import * as rifRollup from 'rif-rollup-js-sdk';

const syncWSProvider = await rifRollup.Provider.newWebsocketProvider('wss://dev.aggregation.rifcomputing.net:3031');

// ..

// Later to close connection.
await syncWSProvider.disconnect();
```

### Create HTTP provider

> Creating provider over HTTP transport.

```typescript
import * as rifRollup from 'rif-rollup-js-sdk';

const syncHTTPProvider = await rifRollup.Provider.newHttpProvider('https://dev.aggregation.rifcomputing.net:3030');
```

### Submit transaction

> Signature

```typescript
async submitTx(tx: any, signature?: TxEthSignature, fastProcessing?: boolean): Promise<string>;
```

#### Inputs and outputs

| Name           | Description                                                                           |
| -------------- | ------------------------------------------------------------------------------------- |
| tx             | Signed RIF Rollup transaction (see types, for detailed description)                   |
| signature      | Signature of the readable representation of the transaction signed by rootstock wallet|
| fastProcessing | For withdrawals only: request faster processing of transaction                        |
| returns        | `0x`-prefixed hex-encoded hash of the transaction                                     |

> Example

```typescript
import * as rifRollup from 'rif-rollup-js-sdk';

const syncHttpProvider = await rifRollup.getDefaultProvider(network);
const signedTransferTx = {
  accountId: 13, // id of the sender account in the RIF Rollup
  type: 'Transfer',
  from: '0x..address1',
  to: '0x..address2',
  token: 0, // id of the RBTC token
  amount: '1000000000000000000', // 1 RBTC in Wei
  fee: '10000000000000000', // 0.01 RBTC in Wei
  nonce: 0,
  signature: {
    pubKey: 'dead..', // hex encoded packed public key of signer (32 bytes)
    signature: 'beef..' // hex encoded signature of the tx (64 bytes)
  }
};

// const readableTxInfo =
//     `Transfer 1.0 RBTC\n` +
//     `To: 0x..address2\n` +
//     `Nonce: 0\n` +
//     `Fee: 0.01 RBTC\n` +
//     `Account Id: 13`;
const signature = '0xdddaaa...1c'; // Rootstock ECDSA signature of the readableTxInfo

const transactionHash = await syncHttpProvider.submitTx(signedTransferTx, signature);
// 0x..hash (32 bytes)
```

### Submit transactions batch

For description of transaction batches, see the [corresponding dev docs section][tx_batches].

[tx_batches]: /dev/payments/sending_transactions/#sending-transaction-batches

> Signature

```typescript
async submitTxsBatch(
  transactions: { tx: any; signature?: TxEthSignature }[],
  signatures?: TxEthSignature | TxEthSignature[]
): Promise<string[]>;
```

#### Inputs and outputs

| Name                     | Description                                                                    |
| ------------------------ | ------------------------------------------------------------------------------ |
| transactions             | An array of transactions / signature pairs.                                    |
| signatures (optional)    | Either a single or a list of signatures that sign the entire batch             |
| returns                  | An array of `0x`-prefixed hex-encoded hashes for each transaction in the batch |

For details on individual transactions, see [Submit transaction](#submit-transaction).

> Example

```typescript
import * as rifRollup from 'rif-rollup-js-sdk';

const syncHttpProvider = await rifRollup.getDefaultProvider(network);
const firstTransferTx = {
  accountId: 13, // id of the sender account in the RIF Rollup
  type: 'Transfer',
  from: '0x..address1',
  to: '0x..address2',
  token: 0, // id of the RBTC token
  amount: '1000000000000000000', // 1 RBTC in Wei
  fee: '10000000000000000', // 0.01 RBTC in Wei
  nonce: 0,
  signature: {
    pubKey: 'dead..', // hex encoded packed public key of signer (32 bytes)
    signature: 'beef..' // hex encoded signature of the tx (64 bytes)
  }
};
const firstTransferEthSignature = '0xdddaaa...1c'; // Rootstock ECDSA signature for the first message

const secondTransferTx = {
  type: 'Transfer'
  // ...other fields omitted
};
const secondTransferEthSignature = '0xaaaddd...ff'; // Rootstock ECDSA signature for the second message

const batch = [
  { tx: firstTransferTx, signature: firstTransferEthSignature },
  { tx: secondTransferTx, signature: secondTransferEthSignature }
];

const transactionHashes = await syncHttpProvider.submitTxsBatch(batch);
// List of transaction hashes
```

### Get contract addresses

> Signature

```typescript
async getContractAddress(): Promise<ContractAddress>;
```

#### Inputs and outputs

| Name    | Description                                                                              |
| ------- | ---------------------------------------------------------------------------------------- |
| returns | Addresses of the RIF Rollup network smart contracts (see types, for detailed description)|

> Example

```typescript
import * as rifRollup from 'rif-rollup-js-sdk';

const syncHttpProvider = await rifRollup.getDefaultProvider(network);

const contractAddresses = await syncHttpProvider.getContractAddress();
```

> Returns

```json
{
  "mainContract": "0xab..cd",
  "govContract": "0xef..12"
}
```

### Get tokens

> Signature

```typescript
async getTokens(): Promise<Tokens>;
```

#### Inputs and outputs

| Name    | Description                                                |
| ------- | ---------------------------------------------------------- |
| returns | All supported tokens (see types, for detailed description) |

> Example

```typescript
import * as rifRollup from 'rif-rollup-js-sdk';

const syncHttpProvider = await rifRollup.getDefaultProvider(network);

const contractAddresses = await syncHttpProvider.getTokens();
```

> Returns

```json
{
  "ERC20-1": {
    "address": "0xbeeb9f55d523918f9cd2979a454610f673c2885e",
    "id": 1,
    "symbol": null
  },
  "RBTC": {
    "address": "0000000000000000000000000000000000000000",
    "id": 0,
    "symbol": "RBTC"
  }
}
```

### Get account state by address

> Signature

```typescript
async getState(address: Address): Promise<AccountState>;
```

#### Inputs and outputs

| Name    | Description                                                                                                |
| ------- | ---------------------------------------------------------------------------------------------------------- |
| address | `0x`-prefixed hex-encoded address of the RIF Rollup account.                                               |
| returns | Detailed state of the RIF Rollup account, including balances, nonce. (see types, for detailed description) |

> Returns

```json
{
  "address": "0x2d5bf7a3ab29f0ff424d738a83f9b0588bc9241e",
  "id": 1, // optional
  "committed": {
    "balances": {
      "RBTC": "1000000000000000000" // 1 RBTC in Wei
    },
    "nonce": 1
  },
  "depositing": {
    "balances": {
      "FAU": {
        "amount": "9000000000000000",
        "expectedAcceptBlock": 438929
      }
    }
  },
  "verified": {
    "balances": {
      "RBTC": "1000000000000000000", // 1 RBTC in Wei
      // ERC20 token
      "FAU": "1000000000000000000"
    },
    "nonce": 0
  }
}
```

For details on the `depositing` section, see the description of `AccountState` type on the `types` page.

### Get amount of confirmations required for priority operations

> Signature

```typescript
async getConfirmationsForEthOpAmount(): Promise<number>;
```

#### Inputs and outputs

| Name    | Description                                                                                    |
| ------- | ---------------------------------------------------------------------------------------------- |
| returns | Amount of confirmations required for priority operations to be processed by RIF Rollup network |

> Example

```typescript
import * as rifRollup from 'rif-rollup-js-sdk';

const syncHttpProvider = await rifRollup.getDefaultProvider(network);
const requiredConfirmationsAmount = await syncHttpProvider.getConfirmationsForEthOpAmount();
```

### Get transaction receipt

> Signature

```typescript
async getTxReceipt(txHash: string): Promise<TransactionReceipt>;
```

#### Inputs and outputs

| Name    | Description                                                         |
| ------- | ------------------------------------------------------------------- |
| txHash  | `sync-tx:`-prefixed hex-encoded hash of the RIF Rollup transaction. |
| returns | Receipt of this transaction (see types, for detailed description)   |

> Returns

```json
// Not executed yet
{
    "executed": false
}

// Success
{
    "executed": true,
    "success": true,
    "block": {
      "blockNumber": 658,
      "committed": true,
      "verified": true
    }
}

// Failure
{
    "executed": true,
    "success": true,
    "failReason": "Nonce mismatch",
    "block": {
      "blockNumber": 658,
      "committed": true,
      "verified": true
    }
}
```

### Wait for transaction receipt

Similar to [Get transaction receipt](#get-transaction-receipt) but this method will return when a given transaction is
committed or verified in the RIF Rollup network.

> Signature

```typescript
async notifyTransaction(
    hash: string,
    action: "COMMIT" | "VERIFY"
): Promise<TransactionReceipt> ;
```

#### Inputs and outputs

<!-- markdownlint-disable MD013 -->

| Name    | Description                                                         |
| ------- | ------------------------------------------------------------------- |
| txHash  | `sync-tx:`-prefixed hex-encoded hash of the RIF Rollup transaction. |
| action  | "COMMIT" or "VERIFY"                                                |
| returns | Receipt of this transaction (see types, for detailed description)   |

> Example

```typescript
import * as rifRollup from 'rif-rollup-js-sdk';

const syncHttpProvider = await rifRollup.getDefaultProvider(network);

const receipt = await syncHttpProvider.notifyTransaction(
  'sync-tx:1111111111111111111111111111111111111111111111111111111111111111',
  'COMMIT'
);
```

### Get priority operation receipt

> Signature

```typescript
async getPriorityOpStatus(
    serialId: number
): Promise<PriorityOperationReceipt>;
```

#### Inputs and outputs

| Name     | Description                            |
| -------- | -------------------------------------- |
| serialId | Numerical ID of the priority operation |
| returns  | Receipt of this priority operation     |

Serial ID of the priority operation can be found in logs of the rootstock transaction that created this operation (e.g.
deposit).

> Returns

```json
{
  "executed": true,
  "block": {
    "blockNumber": 658,
    "committed": true,
    "verified": true
  }
}
```

### Wait for priority operation receipt

Similar to [Get priority operation receipt](#get-priority-operation-receipt) but this method will return when given
priority operation is committed or verified in the RIF Rollup network.

> Signature

```typescript
async notifyPriorityOp(
    serialId: number,
    action: "COMMIT" | "VERIFY"
): Promise<PriorityOperationReceipt>;
```

#### Inputs and outputs

| Name     | Description                             |
| -------- | --------------------------------------- |
| serialId | Numerical id of the priority operation. |
| action   | "COMMIT" or "VERIFY".                   |
| returns  | Receipt of this priority operation.     |

Serial ID of the priority operation can be found in logs of the rootstock transaction that created this operation (e.g.
deposit).

> Example

```typescript
import * as rifRollup from 'rif-rollup-js-sdk';

const syncHttpProvider = await rifRollup.getDefaultProvider(network);

const receipt = await syncHttpProvider.notifyPriorityOp(
  178, // priority op id
  'COMMIT'
);
```

### Current token set

Provider stores list of the available tokens with methods for working with them. (see
[working with tokens](../utils/#working-with-tokens))

> Signature

```typescript
public tokenSet: TokenSet;
```

### Get transaction fee from the server

Performs a query to the server, obtaining an acceptable transaction fee for transactions. The returned value contains
all the price components used for the fee calculation, and the fee itself (`totalFee` field).

**Note:** If fee is requested for a `ForcedExit` operation, corresponding `txType` will be `Withdraw`.

> Signature

```typescript
async getTransactionFee(
    txType: "Withdraw" | "Transfer" | "FastWithdraw" | ChangePubKeyFee | LegacyChangePubKeyFee,
    address: Address,
    tokenLike: TokenLike
): Promise<Fee>;
```

Interface of `IncomingTxFeeType` type is described in the [fees](../types/#fees) section.

#### Inputs and outputs

| Name      | Description                                                                                |
| --------- | ------------------------------------------------------------------------------------------ |
| txType    | Type of the transaction.                                                                   |
| address   | Address of the transaction recipients' wallet.                                             |
| tokenLike | Token used in the transaction.                                                             |
| returns   | Object containing the [packable] fee amount and the price components used for calculation. |

[packable]: ../utils/#amount-packing

### Get transaction batch fee from the server

Performs a query to the server, obtaining an acceptable fee for a batch transaction (multi-transfer).

The fee provided is enough to perform **all** of the transactions of the batch. Thus you usually would need to specify
the fee for only one transaction and set it to zero for the other ones.

**Note:** For details about the type and amount of token for batch transaction fees, see
[transaction batch docs](#submit-transactions-batch).

> Signature

```typescript
async getTransactionsBatchFee(
    txTypes: IncomingTxFeeType[],
    addresses: Address[],
    tokenLike: TokenLike
): Promise<BigNumber>;
```

#### Inputs and outputs

| Name      | Description                                        |
| --------- | -------------------------------------------------- |
| txTypes   | Array of types of transactions in the batch        |
| addresses | Addresses of the corresponding recipients' wallets |
| tokenLike | Token used to pay fees for the batch               |
| returns   | Fee amount sufficient for the batch                |

### Get token price

Performs a query to the server, obtaining a token price in USD. Data is fetched by server using third-party API (e.g.
coinmarketcap).

> Signature

```typescript
async getTokenPrice(
    tokenLike: TokenLike
): Promise<number> ;
```

#### Inputs and outputs

| Name      | Description                                            |
| --------- | ------------------------------------------------------ |
| tokenLike | Type of token.                                         |
| returns   | Currently observed price of the token (USD per token). |

> Example

```typescript
import * as rifRollup from 'rif-rollup-js-sdk';

const syncHttpProvider = await rifRollup.getDefaultProvider(network);
const rbtcPrice = await syncHttpProvider.getTokenPrice('RBTC');

console.log(`Current Rootstock price is ${rbtcPrice} USD`);
```

## RBTC Proxy

`RBTCProxy` class is used to simplify some communication with Rootstock network.

### Create RBTC Proxy

> Signature

```typescript
constructor(
    private ethersProvider: ethers.providers.Provider,
    private contractAddress: ContractAddress
);
```

#### Inputs and outputs

| Name            | Description                                      |
| --------------- | ------------------------------------------------ |
| ethersProvider  | `ethers.js` provider connected to Rootstock node |
| contractAddress | Addresses of the RIF Rollup network contracts    |

> Example

```typescript
import * as rifRollup from 'rif-rollup-js-sdk';
import { ethers } from 'ethers';

const ethersProvider = ethers.getDefaultProvider(network);
const syncHttpProvider = await rifRollup.getDefaultProvider(network);

const rbtcProxy = new rifRollup.RBTCProxy(ethersProvider, syncHttpProvider.contractAddress);
```

### Resolve token id

To sign RIF Rollup transaction users have to know the unique numerical id of the given token. It can be retrieved from the
RIF Rollup network governance contract.

> Signature

```typescript
async resolveTokenId(token: TokenAddress): Promise<number>;
```

#### Inputs and outputs

| Name    | Description                                                        |
| ------- | ------------------------------------------------------------------ |
| token   | Rootstock token address (ERC20 contract address)                   |
| returns | Numerical identifier of the given token inside RIF Rollup network. |

> Example

```typescript
import * as rifRollup from 'rif-rollup-js-sdk';
import { ethers } from 'ethers';

const ethersProvider = ethers.getDefaultProvider(network);
const syncProvider = await rifRollup.getDefaultProvider(network);
const rbtcProxy = new rifRollup.RBTCProxy(ethersProvider, syncProvider.contractAddress);

const rbtcId = await rbtcProxy.resolveTokenId('0x0000000000000000000000000000000000000000'); // RBTC token address is 0x0..0

// ERC20 token if it is supported, >= 1
const erc20Id = await rbtcProxy.resolveTokenId('0xFab46E002BbF0b4509813474841E0716E6730136');
```
