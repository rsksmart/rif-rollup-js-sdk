import { BigNumber, ContractTransaction } from 'ethers';
import { SyncProvider } from './provider-interface';
import { PriorityOperationReceipt, SignedTransaction, TransactionReceipt, TxEthSignature } from './types';
import { SYNC_MAIN_CONTRACT_INTERFACE } from './utils';

export class RifRollupTxError extends Error {
    constructor(message: string, public value: PriorityOperationReceipt | TransactionReceipt) {
        super(message);
    }
}

export class RootstockOperation {
    state: 'Sent' | 'Mined' | 'Committed' | 'Verified' | 'Failed';
    error?: RifRollupTxError;
    priorityOpId?: BigNumber;

    constructor(public ethTx: ContractTransaction, public rifRollupProvider: SyncProvider) {
        this.state = 'Sent';
    }

    async awaitRootstockTxCommit() {
        if (this.state !== 'Sent') return;

        const txReceipt = await this.ethTx.wait();
        for (const log of txReceipt.logs) {
            try {
                const priorityQueueLog = SYNC_MAIN_CONTRACT_INTERFACE.parseLog(log);
                if (priorityQueueLog && priorityQueueLog.args.serialId != null) {
                    this.priorityOpId = priorityQueueLog.args.serialId;
                }
            } catch {}
        }
        if (!this.priorityOpId) {
            throw new Error('Failed to parse tx logs');
        }

        this.state = 'Mined';
        return txReceipt;
    }

    async awaitReceipt(): Promise<PriorityOperationReceipt> {
        this.throwErrorIfFailedState();

        await this.awaitRootstockTxCommit();
        if (this.state !== 'Mined') return;

        let query: number | string;
        if (this.rifRollupProvider.providerType === 'RPC') {
            query = this.priorityOpId.toNumber();
        } else {
            query = this.ethTx.hash;
        }
        const receipt = await this.rifRollupProvider.notifyPriorityOp(query, 'COMMIT');

        if (!receipt.executed) {
            this.setErrorState(new RifRollupTxError('Priority operation failed', receipt));
            this.throwErrorIfFailedState();
        }

        this.state = 'Committed';
        return receipt;
    }

    async awaitVerifyReceipt(): Promise<PriorityOperationReceipt> {
        await this.awaitReceipt();
        if (this.state !== 'Committed') return;

        let query: number | string;
        if (this.rifRollupProvider.providerType === 'RPC') {
            query = this.priorityOpId.toNumber();
        } else {
            query = this.ethTx.hash;
        }
        const receipt = await this.rifRollupProvider.notifyPriorityOp(query, 'VERIFY');

        this.state = 'Verified';

        return receipt;
    }

    private setErrorState(error: RifRollupTxError) {
        this.state = 'Failed';
        this.error = error;
    }

    private throwErrorIfFailedState() {
        if (this.state === 'Failed') throw this.error;
    }
}

export class Transaction {
    state: 'Sent' | 'Committed' | 'Verified' | 'Failed';
    error?: RifRollupTxError;

    constructor(public txData, public txHash: string, public sidechainProvider: SyncProvider) {
        this.state = 'Sent';
    }

    async awaitReceipt(): Promise<TransactionReceipt> {
        this.throwErrorIfFailedState();

        if (this.state !== 'Sent') return;

        const receipt = await this.sidechainProvider.notifyTransaction(this.txHash, 'COMMIT');

        if (!receipt.success) {
            this.setErrorState(new RifRollupTxError(`Rollup transaction failed: ${receipt.failReason}`, receipt));
            this.throwErrorIfFailedState();
        }

        this.state = 'Committed';
        return receipt;
    }

    async awaitVerifyReceipt(): Promise<TransactionReceipt> {
        await this.awaitReceipt();
        const receipt = await this.sidechainProvider.notifyTransaction(this.txHash, 'VERIFY');

        this.state = 'Verified';
        return receipt;
    }

    private setErrorState(error: RifRollupTxError) {
        this.state = 'Failed';
        this.error = error;
    }

    private throwErrorIfFailedState() {
        if (this.state === 'Failed') throw this.error;
    }
}

export async function submitSignedTransaction(
    signedTx: SignedTransaction,
    provider: SyncProvider,
    fastProcessing?: boolean
): Promise<Transaction> {
    const transactionHash = await provider.submitTx(signedTx.tx, signedTx.ethereumSignature, fastProcessing);
    return new Transaction(signedTx, transactionHash, provider);
}

export async function submitSignedTransactionsBatch(
    provider: SyncProvider,
    signedTxs: SignedTransaction[],
    ethSignatures?: TxEthSignature[]
): Promise<Transaction[]> {
    const transactionHashes = await provider.submitTxsBatch(
        signedTxs.map((tx) => {
            return { tx: tx.tx, signature: tx.ethereumSignature };
        }),
        ethSignatures
    );
    return transactionHashes.map((txHash, idx) => new Transaction(signedTxs[idx], txHash, provider));
}
