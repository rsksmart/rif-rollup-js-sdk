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
    // Regular expression pattern to match a valid URL format
    const urlPattern = new RegExp(
      '^' +
        // protocol identifier (optional)
        // short syntax // or long syntax http:// or https://
        '(?:(?:(?:https?|ftp):)?\\/\\/)' +
        // user:pass BasicAuth (optional)
        '(?:\\S+(?::\\S*)?@)?' +
        '(?:' +
        // IP address exclusion
        // private & local networks
        // private IP ranges: 10.0.0.0 - 10.255.255.255, 172.16.0.0 - 172.31.255.255, 192.168.0.0 - 192.168.255.255
        '(?!(?:10|127)(?:\\.\\d{1,3}){3})(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})' +
        // IP address dotted notation octets
        // excludes loopback network 0.0.0.0
        // excludes reserved space >= 224.0.0.0
        // excludes network & broadcast addresses
        // (first & last IP address of each class)
        '(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])' +
        '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}' +
        '(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))' +
        '|' +
        // host & domain names, may end with dot
        // can be replaced by a shortest alternative
        '(?:' +
        '(?:' +
        '[a-z0-9\\u00a1-\\uffff]' +
        '[a-z0-9\\u00a1-\\uffff_-]{0,62}' +
        ')?' +
        '[a-z0-9\\u00a1-\\uffff]\\.' +
        ')+' +
        // TLD identifier name, may end with dot
        '(?:[a-z\\u00a1-\\uffff]{2,}\\.?)' +
        ')' +
        // port number (optional)
        '(?::\\d{2,5})?' +
        // resource path (optional)
        '(?:[/?#]\\S*)?' +
        '$',
      'i'
    );
  
    // Check if the string matches the URL pattern and does not contain executable code
    return urlPattern.test(wasmFileUrl) && !wasmFileUrl.includes('javascript:')
  }
