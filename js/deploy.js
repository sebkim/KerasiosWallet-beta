const AddressMapperJSON = require('../build/contracts/AddressMapper.json');
const KerasiosWalletJSON = require('../build/contracts/KerasiosWallet.json');
const ERC20JSON = require('../build/contracts/ERC20Capped.json');
const program = require('commander');
const getWeb3 = require('../utils/web3')

program
  .command('deployAddressMapper')
  .description('deploy AddressMapper')
  .option('-g, --gas <number>', "Gas Price")
  .option('-f, --fromAccount <number>', "From account of this mnemonic")
  .option('-n, --network <string>', "main or rinkeby")
  .action(async (options) => {
    const gasPrice = options.gas;
    const fromAccountInd = options.fromAccount;
    const network = options.network;
    if(gasPrice == null || fromAccountInd == null || network == null) {
      console.log("Please specify all required options!")
    }

    const web3 = getWeb3(network, fromAccountInd);
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];

    console.log('Attempting to deploy from account', account);
    console.log(`network: ${network}`)
    console.log("");

    let whichAbi = null;
    let whichBytecode = null;
    whichAbi = AddressMapperJSON.abi
    whichBytecode = AddressMapperJSON.bytecode;

    let trans_res = await new web3.eth.Contract(
        whichAbi
    )
    .deploy({
        data: whichBytecode
    })
    .send({
        from: account,
        gasPrice: gasPrice,
        gas: 6000000
    });
    console.log("Deployed contract to ", trans_res.options.address)
    console.log("Done!")
  })

  program
  .command('deployKerasiosWallet')
  .description('deploy KerasiosWallet')
  .option('-g, --gas <number>', "Gas Price")
  .option('-f, --fromAccount <number>', "From account of this mnemonic")
  .option('-n, --network <string>', "main or rinkeby")
  .option('-m, --mapperAddr <string>', "AddressMapper address")
  .action(async (options) => {
    const gasPrice = options.gas;
    const fromAccountInd = options.fromAccount;
    const network = options.network;
    const mapperAddr = options.mapperAddr;
    if(gasPrice == null || fromAccountInd == null || network == null || mapperAddr == null) {
      console.log("Please specify all required options!")
    }

    const web3 = getWeb3(network, fromAccountInd);
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];

    console.log('Attempting to deploy from account', account);
    console.log(`network: ${network}`)
    console.log("");

    let whichAbi = null;
    let whichBytecode = null;
    whichAbi = KerasiosWalletJSON.abi
    whichBytecode = KerasiosWalletJSON.bytecode;

    let trans_res = await new web3.eth.Contract(
        whichAbi
    )
    .deploy({
        data: whichBytecode,
        arguments: [mapperAddr]
    })
    .send({
        from: account,
        gasPrice: gasPrice,
        gas: 6000000
    });
    console.log("Deployed contract to ", trans_res.options.address)
    console.log("Done!")
  })

program
  .command('deployERC20')
  .description('deploy ERC20')
  .option('-g, --gas <number>', "Gas Price")
  .option('-f, --fromAccount <number>', "From account of this mnemonic")
  .option('-n, --network <string>', "main or rinkeby")
  .option('-m, --mapperAddr <string>', "AddressMapper address")
  .action(async (options) => {
    // constructor parameters
    const cap = '1000000000000000000000000000'
    const name = 'Kerasios Test 5'
    const symbol = 'KRSTest5'
    const decimals = '18'
    ///
    const gasPrice = options.gas;
    const fromAccountInd = options.fromAccount;
    const network = options.network;
    const mapperAddr = options.mapperAddr;
    if(gasPrice == null || fromAccountInd == null || network == null || mapperAddr == null) {
      console.log("Please specify all required options!")
    }

    const web3 = getWeb3(network, fromAccountInd);
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];

    console.log('Attempting to deploy from account', account);
    console.log(`network: ${network}`)
    console.log("");

    let whichAbi = null;
    let whichBytecode = null;
    whichAbi = ERC20JSON.abi
    whichBytecode = ERC20JSON.bytecode;

    let trans_res = await new web3.eth.Contract(
        whichAbi
    )
    .deploy({
        data: whichBytecode,
        arguments: [mapperAddr, cap, name, symbol, decimals]
    })
    .send({
        from: account,
        gasPrice: gasPrice,
        gas: 6000000
    });
    console.log("Deployed contract to ", trans_res.options.address)
    console.log("Done!")
  })

program
  .version('0.1.0')
  .parse(process.argv)
  