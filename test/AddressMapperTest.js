
var AddressMapper = artifacts.require("./AddressMapper");
var ERC20Capped = artifacts.require("./ERC20Capped");

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

const deployContract = () => {
    return AddressMapper.new()
}

const deployERC20 = (addressMapperAddr, cap, name, symbol, decimals) => {
    return ERC20Capped.new(addressMapperAddr, cap, name, symbol, decimals)
}

contract('AddressMapper Test', function(accounts) {
    // console.log(accounts)
    let ins;
    let erc20;
    let globalBoolPrint = false
    beforeEach(async () => {
        ins = await deployContract()
        erc20 = await deployERC20(ins.address, '1000000000000000000000000000', 'Kerasios Test', 'KRSTest', '18')
        assert.ok(ins)
        assert.ok(erc20)
    })

    it("doMap unMap basic test 1.", async () => {
        let boolPrint = false
        let acc1Str = 'accounts[0]@gmail.com'
        let acc2Str = 'accounts[1]@gmail.com'
        let trans1 = await ins.doMap(accounts[0], acc1Str);
        if(boolPrint || globalBoolPrint) {
            console.log(trans1)
            console.log(trans1.logs[0].args)
            console.log('-----')
        }
        assert.equal(await ins.mapper(accounts[0]), acc1Str)
        
        let trans2 = await ins.doMap(accounts[1], acc2Str);
        if(boolPrint || globalBoolPrint) {
            console.log(trans2)
            console.log(trans2.logs[0].args)
            console.log('-----')
        }
        assert.equal(await ins.mapper(accounts[1]), acc2Str)

        let trans3 = await ins.unMap(accounts[0]);
        if(boolPrint || globalBoolPrint) {
            console.log(trans3)
            console.log(trans3.logs[0].args)
            console.log('-----')
        }
        assert.equal(await ins.mapper(accounts[0]), '')

        assert.equal(false, await ins.isAddressSet(accounts[0]))
        assert.equal(true, await ins.isAddressSet(accounts[1]))
    })

    it("doMap onlyMaster test.", async () => {
        await assertThrowsAsynchronously(
            () => ins.doMap(accounts[0], 'accounts[0]@gmail.com', {from: accounts[2]})
        )        
    })

    it("doMap onlyNotSet test.", async () => {
        await ins.doMap(accounts[0], 'accounts[0]@gmail.com', {from: accounts[0]})
        await assertThrowsAsynchronously(
            () => ins.doMap(accounts[0], 'accounts[0]changed@gmail.com', {from: accounts[0]})
        )
    })

    it("unMap onlyMaster test.", async () => {
        await assertThrowsAsynchronously(
            () => ins.unMap(accounts[0], 'accounts[0]@gmail.com', {from: accounts[3]})
        )
    })

    it("doMapAuto test.", async () => {
        let hdata = web3.utils.fromAscii('accounts[x]emailaddress@gmail.com')
        let boolPrint = true;
        let toAsciiData = web3.utils.toAscii(hdata)
        let hAccount = accounts[4];
        
        let beforeBalance = await web3.eth.getBalance(hAccount)
        let trans1 = await web3.eth.sendTransaction({
            to: ins.address,
            value: '123',
            from: hAccount,
            data: hdata,
            gas: '700000'
        })
        let afterBalance = await web3.eth.getBalance(hAccount)
        
        assert.equal(await ins.mapper(hAccount), toAsciiData)

        if(boolPrint || globalBoolPrint) {
            console.log('-----')
            console.log(`rawData: ${hdata}`)
            console.log(`data: ${toAsciiData}`)
            // console.log(`beforeBalance: ${beforeBalance}`)
            // console.log(`afterBalance: ${afterBalance}`)
            console.log('-----')
        }

        await assertThrowsAsynchronously(
            () => {
                return web3.eth.sendTransaction({
                    to: ins.address,
                    value: '123',
                    from: hAccount,
                    data: hdata,
                    gas: '700000'
                })
            }
        )

    })

    it("token withdraw test.", async () => {
        let boolPrint = true;
        let hAccount = accounts[6];
        
        await erc20.mint(hAccount, '1000000000000000000')

        let initTransferBal = '12345678'
        let secondTransferBal = '2345678'
        let trans1 = await erc20.transfer(ins.address, initTransferBal, {from: hAccount})
        let beforeBalance = await erc20.balanceOf(ins.address)
        assert.equal(initTransferBal, beforeBalance)
        
        let abiData = erc20.contract.transfer.getData(hAccount, secondTransferBal)
        await ins.submitTransaction(erc20.address, '0', abiData, {from: accounts[0]})
        let afterBalance = await erc20.balanceOf(ins.address)
        assert.equal(parseInt(initTransferBal) - parseInt(secondTransferBal), afterBalance)
        
        if(boolPrint || globalBoolPrint) {
            console.log('-----')
            console.log(`instance address: ${ins.address}`)
            console.log(`beforeBalance: ${beforeBalance}`)
            console.log(`afterBalance: ${afterBalance}`)
            console.log('-----')
        }

    })

    it("Token: setIsPrevented test.", async () => {
        let hAccount = accounts[8]
        await erc20.setIsPreventedAddr(hAccount, true)
        assert.equal(true, await erc20.isPreventedAddr(hAccount))
        
        await erc20.setIsPreventedAddr(hAccount, false)
        assert.equal(false, await erc20.isPreventedAddr(hAccount))

        await assertThrowsAsynchronously(
            () => erc20.setIsPreventedAddr(hAccount, true, {from: accounts[1]})
        )

    })

    it("Token: transfer test.", async () => {

        const bal1 = '12345'
        await erc20.mint(accounts[0], '1000000000000000000')
        let t1 = await erc20.transfer(accounts[1], bal1)
        assert.equal(bal1, await erc20.balanceOf(accounts[1]))
        
        const bal2 = '456'
        await erc20.transfer(accounts[2], bal2, {from: accounts[1]})
        assert.equal(bal2, await erc20.balanceOf(accounts[2]))
        assert.equal(parseInt(bal1) - parseInt(bal2), await erc20.balanceOf(accounts[1]))

    })

    it("Token: transferFrom test.", async () => {

        const bal1 = '12345'
        await erc20.mint(accounts[0], '1000000000000000000')
        await erc20.approve(accounts[1], bal1)
        await erc20.transferFrom(accounts[0], accounts[2], bal1, {from: accounts[1]})
        assert.equal(bal1, await erc20.balanceOf(accounts[2]))
        
        await assertThrowsAsynchronously(
            () => erc20.transferFrom(accounts[0], accounts[2], bal1, {from: accounts[5]})
        )
    })

    it("Token: checkedTransfer test.", async () => {
        let initMint = '1000000000000000000'
        await erc20.mint(accounts[0], initMint)

        let bal1 = '1357'
        let preventedAddr = accounts[5]
        await erc20.setIsPreventedAddr(preventedAddr, true)

        await assertThrowsAsynchronously(
            () => erc20.transfer(preventedAddr, bal1)
        )

        // accounts[0] account set
        let hdata = web3.utils.fromAscii('accounts[x]emailaddress@gmail.com')
        let trans1 = await web3.eth.sendTransaction({
            to: ins.address,
            value: '123',
            from: accounts[0],
            data: hdata,
            gas: '700000'
        })
        ///

        await erc20.transfer(preventedAddr, bal1)
        assert.equal(bal1, await erc20.balanceOf(preventedAddr))
        assert.equal(parseInt(initMint) - parseInt(bal1), await erc20.balanceOf(accounts[0]))
    })

    it("Token: checkedTransferFrom test.", async () => {
        let initMint = '1000000000000000000'
        await erc20.mint(accounts[0], initMint)

        let bal1 = '1357'
        let preventedAddr = accounts[5]
        await erc20.setIsPreventedAddr(preventedAddr, true)
        await erc20.approve(accounts[1], bal1)

        await assertThrowsAsynchronously(
            () => erc20.transferFrom(accounts[0], preventedAddr, bal1, {from: accounts[1]})
        )

        // accounts[0] account set
        let hdata = web3.utils.fromAscii('accounts[x]emailaddress@gmail.com')
        let trans1 = await web3.eth.sendTransaction({
            to: ins.address,
            value: '123',
            from: accounts[0],
            data: hdata,
            gas: '700000'
        })
        ///

        await erc20.transferFrom(accounts[0], preventedAddr, bal1, {from: accounts[1]})
        assert.equal(bal1, await erc20.balanceOf(preventedAddr))
        assert.equal(parseInt(initMint) - parseInt(bal1), await erc20.balanceOf(accounts[0]))
    })

});
