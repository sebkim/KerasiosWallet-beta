const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const path = require('path')
const fs = require('fs-extra');
const mnemonic = fs.readFileSync(path.resolve(__dirname, '../mnemonic.txt'), 'utf8')


const getProvider = (netType, accountInd) => {
    let provider
    if(netType === 'main') {
        provider = new HDWalletProvider(
            mnemonic,
            'https://mainnet.infura.io/G6jiWFDK2hiEfZVJG8w1',
            accountInd
        );
    } else if(netType == 'rinkeby') {
        provider = new HDWalletProvider(
            mnemonic,
            'https://rinkeby.infura.io/G6jiWFDK2hiEfZVJG8w1',
            accountInd
        );
    } else {
        return
    }
    return provider;
}

const getWeb3 = (netType, accountInd) => {
    const provider = getProvider(netType, accountInd)
    const web3 = new Web3(provider);
    return web3;
}

module.exports = getWeb3
