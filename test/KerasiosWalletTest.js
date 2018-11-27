
var AddressMapper = artifacts.require("./AddressMapper");
var ERC20Capped = artifacts.require("./ERC20Capped");
var KerasiosWallet = artifacts.require("./KerasiosWallet");
const BN = require('bn.js')

const Web3 = require('web3');
let web3;
// We are on the server *OR* the user is not running metamask
const provider = new Web3.providers.HttpProvider("http://localhost:7545")
web3 = new Web3(provider);

async function assertThrowsAsynchronously(test, error) {
    try {
        await test();
    } catch(e) {
        if (!error || e instanceof error)
            return "everything is fine";
    }
    throw new Error("Missing rejection" + (error ? " with "+error.name : ""));
}

const deployAddressMapper = () => {
    return AddressMapper.new()
}

const deployKRSWallet = (addressMapperAddr) => {
    return KerasiosWallet.new(addressMapperAddr)
}

const deployERC20 = (addressMapperAddr, cap, name, symbol, decimals) => {
    return ERC20Capped.new(addressMapperAddr, cap, name, symbol, decimals)
}


contract('KerasiosWallet Test', function(accounts) {
    // console.log(accounts)
    let addrMapper;
    let krsWallet;
    let erc20;
    let globalBoolPrint = false
    beforeEach(async () => {
        addrMapper = await deployAddressMapper()
        krsWallet = await deployKRSWallet(addrMapper.address)
        erc20 = await deployERC20(addrMapper.address, '1000000000000000000000000000', 'Kerasios Test', 'KRSTest', '18')
        assert.ok(addrMapper)
        assert.ok(krsWallet)
        assert.ok(erc20)
    })

    it("krsWallet prohibits depositing ether from notRegistered user.", async () => {
        await assertThrowsAsynchronously(
            () => {
                return web3.eth.sendTransaction({
                    to: krsWallet.address,
                    value: '123123123',
                    from: accounts[0],
                    gas: '700000'
                })
            }
        )

        await assertThrowsAsynchronously(
            () => {
                return web3.eth.sendTransaction({
                    to: krsWallet.address,
                    value: '123123123',
                    from: accounts[3],
                    gas: '700000'
                })
            }
        )
    })

    it("krsWallet accepts depositing ether from registered user, and can do submitTransaction.", async () => {
        // user register process
        let hdata = web3.utils.fromAscii('accounts[x]emailaddress@gmail.com')
        await web3.eth.sendTransaction({
            to: addrMapper.address,
            value: '123',
            from: accounts[0],
            data: hdata,
            gas: '700000'
        })
        ///

        let bal1 = '1000001234'
        await web3.eth.sendTransaction({
            to: krsWallet.address,
            value: bal1,
            from: accounts[0],
            gas: '700000'
        })
        assert.equal(bal1, await web3.eth.getBalance(krsWallet.address))


        let initAccount4bal = new BN(await web3.eth.getBalance(accounts[4]))
        await krsWallet.submitTransaction(accounts[4], bal1, '')
        let afterAccount4bal = new BN(await web3.eth.getBalance(accounts[4]))
        let bnBal1 = new BN(bal1)

        assert.equal('0', await web3.eth.getBalance(krsWallet.address))
        assert.equal(initAccount4bal.add(bnBal1).toString(), afterAccount4bal.toString())

    })
    
    it("krsWallet can withdraw ERC20 token.", async () => {
        let initBal = '100000'
        await erc20.mint(accounts[0], initBal)

        let bal1 = '123'
        await erc20.transfer(krsWallet.address, bal1)
        assert.equal(bal1, await erc20.balanceOf(krsWallet.address))

        let abiData = erc20.contract.transfer.getData(accounts[0], bal1)
        await krsWallet.submitTransaction(erc20.address, '0', abiData)
        assert.equal('0', await erc20.balanceOf(krsWallet.address))
        assert.equal(initBal, await erc20.balanceOf(accounts[0]))
        
    })
});
