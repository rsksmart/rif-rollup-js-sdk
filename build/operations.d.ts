import { BigNumber, ContractTransaction } from 'ethers';
import { SyncProvider } from './provider-interface';
import { PriorityOperationReceipt, SignedTransaction, TransactionReceipt, TxEthSignature } from './types';
export declare class RifRollupTxError extends Error {
    value: PriorityOperationReceipt | TransactionReceipt;
    constructor(message: string, value: PriorityOperationReceipt | TransactionReceipt);
}
export declare class ETHOperation {
    ethTx: ContractTransaction;
    rifRollupProvider: SyncProvider;
    state: 'Sent' | 'Mined' | 'Committed' | 'Verified' | 'Failed';
    error?: RifRollupTxError;
    priorityOpId?: BigNumber;
    constructor(ethTx: ContractTransaction, rifRollupProvider: SyncProvider);
    awaitEthereumTxCommit(): Promise<import("ethers").ContractReceipt>;
    awaitReceipt(): Promise<PriorityOperationReceipt>;
    awaitVerifyReceipt(): Promise<PriorityOperationReceipt>;
    private setErrorState;
    private throwErrorIfFailedState;
}
export declare class Transaction {
    txData: any;
    txHash: string;
    sidechainProvider: SyncProvider;
    state: 'Sent' | 'Committed' | 'Verified' | 'Failed';
    error?: RifRollupTxError;
    constructor(txData: any, txHash: string, sidechainProvider: SyncProvider);
    awaitReceipt(): Promise<TransactionReceipt>;
    awaitVerifyReceipt(): Promise<TransactionReceipt>;
    private setErrorState;
    private throwErrorIfFailedState;
}
export declare function submitSignedTransaction(signedTx: SignedTransaction, provider: SyncProvider, fastProcessing?: boolean): Promise<Transaction>;
export declare function submitSignedTransactionsBatch(provider: SyncProvider, signedTxs: SignedTransaction[], ethSignatures?: TxEthSignature[]): Promise<Transaction[]>;
