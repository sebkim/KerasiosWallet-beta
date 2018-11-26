
var AddressMapper = artifacts.require("./AddressMapper");
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

contract('AddressMapper Test', function(accounts) {
    console.log(accounts)
    let ins;
    let globalBoolPrint = false
    beforeEach(async () => {
        ins = await deployContract()
        assert.ok(ins)
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

});
