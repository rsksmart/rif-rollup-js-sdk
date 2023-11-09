import { Signature } from './types';

import * as rifRollupCrypto from 'zksync-crypto';
import { utils } from 'ethers';

/**
 * This variable stores the zksync-crypto module compiled into
 * asm.js for environments without WebAssembly support (e.g. React Native).
 * It's either loaded once or left to be undefined, so whenever
 * we are using the crypto package, we do it in the following way:
 * ```
 * const _rifRollupCrypto = asmJs || zks;
 * const signature = _rifRollupCrypto.sign_musig(privKey, bytes);
 * ```
 */
let asmJs = undefined;

export async function privateKeyFromSeed(seed: Uint8Array): Promise<Uint8Array> {
    await loadRifRollupCrypto();

    const _rifRollupCrypto = asmJs || rifRollupCrypto;
    return _rifRollupCrypto.privateKeyFromSeed(seed);
}

export async function signTransactionBytes(privKey: Uint8Array, bytes: Uint8Array): Promise<Signature> {
    await loadRifRollupCrypto();

    const _rifRollupCrypto = asmJs || rifRollupCrypto;
    const signaturePacked = _rifRollupCrypto.sign_musig(privKey, bytes);
    const pubKey = utils.hexlify(signaturePacked.slice(0, 32)).substr(2);
    const signature = utils.hexlify(signaturePacked.slice(32)).substr(2);
    return {
        pubKey,
        signature
    };
}

export async function privateKeyToPubKeyHash(privateKey: Uint8Array): Promise<string> {
    await loadRifRollupCrypto();

    const _rifRollupCrypto = asmJs || rifRollupCrypto;
    return `sync:${utils.hexlify(_rifRollupCrypto.private_key_to_pubkey_hash(privateKey)).substr(2)}`;
}

export async function rescueHashOrders(orders: Uint8Array): Promise<Uint8Array> {
    await loadRifRollupCrypto();

    const _rifRollupCrypto = asmJs || rifRollupCrypto;
    return _rifRollupCrypto.rescueHashOrders(orders);
}

let rifRollupCryptoLoaded = false;
export async function loadRifRollupCrypto(wasmFileUrl?: string) {
    if (rifRollupCryptoLoaded) {
        return;
    }

    if (wasmFileUrl && !validateWasmFileUrl(wasmFileUrl)) {
        throw new Error('Invalid wasmFileUrl');
    }
    // Only runs in the browser
    const _rifRollupCrypto = rifRollupCrypto as any;
    if (_rifRollupCrypto.loadZkSyncCrypto) {
        if (!_rifRollupCrypto.wasmSupported()) {
            // Load the asm.js build which will be used instead.
            // wasmFileUrl will be ignored.
            asmJs = await _rifRollupCrypto.loadZkSyncCrypto(wasmFileUrl);
        } else {
            // It is ok if wasmFileUrl is not specified.
            // Actually, typically it should not be specified,
            // since the content of the `.wasm` file is read
            // from the `.js` file itself.
            await _rifRollupCrypto.loadZkSyncCrypto(wasmFileUrl);
        }
        rifRollupCryptoLoaded = true;
    }
}

const validateWasmFileUrl = (wasmFileUrl: string) => {
    try {
        const parsedUrl = new URL(wasmFileUrl);
        const hostname = parsedUrl.hostname;
        const path = parsedUrl.pathname;
        const protocol = parsedUrl.protocol.replace(':', '');
    
        const privateIpRangesRegex = /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/;
        const pathRegex = /[\s'";]+/; // Example regex to check for suspicious characters in the path
    
        if (!['http', 'https', 'ftp'].includes(protocol)) {
          throw new Error('Invalid Protocol, http, https, ftp only allowed');
        }
    
        if (privateIpRangesRegex.test(hostname)) {
          throw new Error('Invalid Hostname');
        }
    
        if (pathRegex.test(path)) {

          throw new Error('Url path contains suspicious characters'); // Path contains suspicious characters
        }
    
        return true; // URL passes all checks
      } catch (error) {
        console.error('Invalid Url', error)
        return false; // URL is not valid
      }
  };
