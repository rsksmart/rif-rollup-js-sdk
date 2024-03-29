# Appendix A: Using bundle in a browser

It is possible to use `rif-rollup-js-sdk` in a browser directly.

- `ethers@5.0` dependency is required for `rif-rollup-js-sdk` to work.

> Example with rif-rollup-js-sdk fetched from [https://unpkg.com](https://unpkg.com) CDN

```html
<html>
  <body>
    <script type="text/javascript" src="https://cdn.ethers.io/lib/ethers-5.0.umd.min.js"></script>
    <script type="text/javascript" src="https://unpkg.com/rif-rollup@0.8.1/dist/main.js"></script>
    <script type="text/javascript">
      (async () => {
        const ethWallet = ethers.Wallet.createRandom();

        const zksProvider = await rifRollup.getDefaultProvider(network);
        const rifRollupWallet = await rifRollup.Wallet.fromEthSigner(ethWallet, zksProvider);
        console.log('RBTC balance:', (await rifRollupWallet.getBalance('RBTC')).toString());

        const privateKey = await rifRollup.crypto.privateKeyFromSeed(new Uint8Array(32));
        const pubkeyHash = await rifRollup.crypto.privateKeyToPubKeyHash(privateKey);
        console.log('PrivateKey', ethers.utils.hexlify(privateKey), 'PubkeyHash', pubkeyHash);
      })();
    </script>
  </body>
</html>
```
