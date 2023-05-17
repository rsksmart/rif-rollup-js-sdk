import * as fs from 'fs';
// import * as path from 'path';

function configPath(postfix: string) {
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
    return path.join(__dirname, `etc/test_config/${postfix}`);
=======
    return `tests/etc/test_config/${postfix}`;
>>>>>>> 0d6b954 (fix: fix issue of reading path incorrectly)
=======
    return path.join(__dirname, `etc/test_config/${postfix}`);
>>>>>>> 58b33aa (fix: use absolute path method for path resolution)
=======
    return `tests/etc/test_config/${postfix}`;
>>>>>>> 7b21bde (fix: use relative path structure)
}

function loadConfig(filepath: string) {
    return JSON.parse(
        fs.readFileSync(filepath, {
            encoding: 'utf-8'
        })
    );
}

export function loadTestConfig(withWithdrawalHelpers: boolean) {
    const eipConstantPath = configPath('constant/eip1271.json');
    const eipVolatilePath = configPath('volatile/eip1271.json');

    const eipConstantConfig = loadConfig(eipConstantPath);
    const eipVolatileConfig = loadConfig(eipVolatilePath);
    const eipConfig = Object.assign(eipConstantConfig, eipVolatileConfig);

    const ethConstantPath = configPath('constant/eth.json');
    const ethConfig = loadConfig(ethConstantPath);

    if (withWithdrawalHelpers) {
        const withdrawalHelpersConfigPath = configPath('volatile/withdrawal-helpers.json');
        const withdrawalHelpersConfig = loadConfig(withdrawalHelpersConfigPath);
        return {
            eip1271: eipConfig,
            eth: ethConfig,
            withdrawalHelpers: withdrawalHelpersConfig
        };
    } else {
        return {
            eip1271: eipConfig,
            eth: ethConfig
        };
    }
}

export function loadTestVectorsConfig() {
    let vectorsConfigPath = configPath('sdk/test-vectors.json');
    return loadConfig(vectorsConfigPath);
}

export function getTokens(network: string) {
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
    const configPath = path.join(__dirname, `etc/tokens/${network}.json`);
=======
    const configPath = `tests/etc/tokens/${network}.json`;
>>>>>>> 0d6b954 (fix: fix issue of reading path incorrectly)
=======
    const configPath = path.join(__dirname, `etc/tokens/${network}.json`);
>>>>>>> 58b33aa (fix: use absolute path method for path resolution)
=======
    const configPath = `tests/etc/tokens/${network}.json`;
>>>>>>> 7b21bde (fix: use relative path structure)
    return JSON.parse(
        fs.readFileSync(configPath, {
            encoding: 'utf-8'
        })
    );
}

export function getTokenList(source: string) {
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
    const configPath = path.join(__dirname, `etc/token-lists/${source}.json`);
=======
    const configPath = `tests/etc/token-lists/${source}.json`;
=======
    const configPath = path.join(__dirname, `tests/etc/token-lists/${source}.json`);
>>>>>>> 58b33aa (fix: use absolute path method for path resolution)
    console.log(configPath);
>>>>>>> 0d6b954 (fix: fix issue of reading path incorrectly)
=======
    const configPath = `tests/etc/token-lists/${source}.json`;
>>>>>>> 7b21bde (fix: use relative path structure)
    return JSON.parse(
        fs.readFileSync(configPath, {
            encoding: 'utf-8'
        })
    );
}