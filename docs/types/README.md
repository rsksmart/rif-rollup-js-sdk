# Types

## Tokens and common types

```typescript
// Symbol like "RBTC" or "RIF" or token contract address(zero address is implied for "RBTC").
export type TokenLike = TokenSymbol | TokenAddress;
// Token symbol (e.g. "RBTC", "RIF", etc.)
export type TokenSymbol = string;
// Token address (e.g. 0xde..ad for ERC20, or 0x00.00 for "RBTC")
export type TokenAddress = string;

// List of all available tokens
export interface Tokens {
  // Tokens are indexed by their symbol (e.g. "RBTC")
  [token: string]: {
    address: string;
    id: number;
    symbol: string;
    decimals: number;
  };
}

// Addresses of the RIF Rollup contracts
export interface ContractAddress {
  mainContract: string;
  govContract: string;
}

// 0x-prefixed, hex encoded, Rootstock account address
export type Address = string;

// Committed nonce is going to be resolved to last nonce known to the RIF Rollup network
export type Nonce = number | 'committed';

// Denotes how authorization of operation is performed:
// 'Onchain' if it's done by sending an Rootstock transaction,
// 'ECDSA' if it's done by providing an Rootstock signature in RIF Rollup transaction.
// 'CREATE2' if it's done by providing arguments to restore account Rootstock address according to CREATE2 specification.
// 'ECDSALegacyMessage' if it's done by providing an Rootstock signature in RIF Rollup transaction. Unlike the 'ECDSA', the user signs a human-readable message. Thus, the fee is ~30% higher than ECDSA.
export type ChangePubkeyTypes = 'Onchain' | 'ECDSA' | 'CREATE2' | 'ECDSALegacyMessage';

// CREATE2 Data
export interface Create2Data {
  creatorAddress: string;
  saltArg: string;
  codeHash: string;
}
```

## Fees

```typescript
// Unified fee and batch fee interfaces.
export type Fee = FeeRpc | FeeRest;
export type BatchFee = BatchFeeRpc | FeeRest;

export type IncomingTxFeeType =
  | 'Withdraw'
  | 'Transfer'
  | 'FastWithdraw'
  | 'ForcedExit'
  | 'MintNFT'
  | 'WithdrawNFT'
  | 'FastWithdrawNFT'
  | 'Swap'
  | ChangePubKeyFee
  | LegacyChangePubKeyFee;

export interface FeeRpc {
  // Operation type (amount of chunks in operation differs and impacts the total fee).
  feeType: 'Withdraw' | 'Transfer' | 'TransferToNew' | 'FastWithdraw' | ChangePubKeyFee | 'MintNFT' | 'WithdrawNFT' | 'Swap';
  // Amount of gas used by transaction
  gasTxAmount: BigNumber;
  // Gas price (in wei)
  gasPriceWei: BigNumber;
  // Rootstock gas part of fee (in wei)
  gasFee: BigNumber;
  // Zero-knowledge proof part of fee (in wei)
  zkpFee: BigNumber;
  // Total fee amount (in wei)
  totalFee: BigNumber;
}

export interface FeeRest {
  gasFee: BigNumber;
  zkpFee: BigNumber;
  totalFee: BigNumber;
}

export interface BatchFeeRpc {
  // Total fee amount (in wei)
  totalFee: BigNumber;
}

export type TotalFee = Map<TokenLike, BigNumber>;
```

`ChangePubKeyFee` interface is defined as follows:

```typescript
export interface ChangePubKeyFee {
  // Denotes how authorization of operation is performed:
  // 'Onchain' if it's done by sending an Rootstock transaction,
  // 'ECDSA' if it's done by providing an Rootstock signature in RIF Rollup transaction.
  // 'CREATE2' if it's done by providing arguments to restore account Rootstock address according to CREATE2 specification.
  ChangePubKey: ChangePubkeyTypes;
}

export type ChangePubkeyTypes = 'Onchain' | 'ECDSA' | 'CREATE2' | 'ECDSALegacyMessage';
```

`LegacyChangePubKeyFee` interface is defined as follows:

```typescript
export interface LegacyChangePubKeyFee {
  ChangePubKey: {
    // Denotes how authorization of operation is performed:
    // 'true' if it's done by sending an Rootstock transaction,
    // 'false' if it's done by providing an Rootstock signature in RIF Rollup transaction.
    onchainPubkeyAuth: boolean;
  };
}
```

## Account state

```typescript
import { utils } from 'ethers';

// 0x-prefixed, hex encoded, Rootstock account address
export type Address = string;
// sync:-prefixed, hex encoded, hash of the account public key
export type PubKeyHash = string;

export interface AccountState {
  // Rootstock address of the account
  address: Address;
  id?: number;
  // Data about deposits that already are on the Rootstock blockchain, but
  // not yet processed by the RIF Rollup network.
  depositing: {
    balances: {
      // Token are indexed by their symbol (e.g. "RBTC")
      [token: string]: {
        // Sum of pending deposits for the token.
        amount: BigNumberish;
        // Value denoting the block number when the funds are expected
        // to be received by RIF Rollup network.
        expectedAcceptBlock: number;
      };
    };
  };
  // Committed state is the last state known to the RIF Rollup network, can be ahead of verified state
  committed: {
    balances: {
      // Token are indexed by their symbol (e.g. "RBTC")
      [token: string]: BigNumberish;
    };
    // Nonce is equal to that of the next valid transaction.
    nonce: number;
    // Public key hash of the signer keys associated with account
    pubKeyHash: PubKeyHash;
  };
  // Verified state is proved with ZKP on the Rootstock network.
  verified: {
    balances: {
      // Token are indexed by their symbol (e.g. "RBTC")
      [token: string]: BigNumberish;
    };
    // Nonce is equal to that of the next valid transaction.
    nonce: number;
    // Public key hash of the signer keys associated with account
    pubKeyHash: PubKeyHash;
  };
}
```

"Depositing" balances are balances for which deposit operation has already appeared on the Rootstock blockchain, but
which still do not have enough confirmations to be processed by the `rifRollup` network.

For depositing balances, two fields are available: `amount` (sum of ongoing deposit operations for token), and
`expectedAcceptBlock` - the number of block, when all the deposit operations for this token are expected to be processed
by `rifRollup` network.

Note that `depositing` balance data is anticipated, since block with deposit operation can be reverted on Rootstock
blockchain. This information should be used for informing user about ongoing operations only, and not taken as a
guarantee of the execution.

## Transactions

```typescript
import { utils } from 'ethers';

export interface Signature {
  pubKey: string;
  signature: string;
}

export type EthSignerType = {
  verificationMethod: 'ECDSA' | 'ERC-1271';
  // Indicates if signer adds `\x19Rootstock Signed Message\n${msg.length}` prefix before signing message.
  // i.e. if false, we should add this prefix manually before asking to sign message
  isSignedMsgPrefixed: boolean;
};

export interface TxEthSignature {
  type: 'RootstockSignature' | 'EIP1271Signature';
  signature: string;
}

export interface Transfer {
  type: 'Transfer';
  from: Address;
  to: Address;
  token: number;
  amount: BigNumberish;
  fee: BigNumberish;
  nonce: number;
  signature: Signature;
}

export interface Withdraw {
  type: 'Withdraw';
  from: Address;
  to: Address;
  token: number;
  amount: BigNumberish;
  fee: BigNumberish;
  nonce: number;
  signature: Signature;
}

export interface ForcedExit {
  type: 'ForcedExit';
  initiatorAccountId: number;
  target: Address;
  token: number;
  fee: BigNumberish;
  nonce: number;
  signature: Signature;
}

export interface ChangePubKey {
  type: 'ChangePubKey';
  accountId: number;
  account: Address;
  newPkHash: PubKeyHash;
  feeToken: number;
  fee: BigNumberish;
  nonce: number;
  signature: Signature;
  ethSignature: string;
}

export interface SignedTransaction {
  tx: Transfer | Withdraw | ChangePubKey | CloseAccount | ForcedExit;
  RootstockSignature?: TxEthSignature;
}

export interface BlockInfo {
  blockNumber: number;
  committed: boolean;
  verified: boolean;
}

export interface TransactionReceipt {
  executed: boolean;
  success?: boolean;
  failReason?: string;
  block?: BlockInfo;
}

export interface PriorityOperationReceipt {
  executed: boolean;
  block?: BlockInfo;
}

export interface Toggle2FARequest {
  enable: boolean;
  accountId: number;
  timestamp: number;
  signature: TxEthSignature;
}

export interface Toggle2FAResponse {
  success: boolean;
}
```
