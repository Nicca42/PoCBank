const {
    ether
} = require('./helpers/ether');
const {
    expectThrow
} = require('./helpers/expectThrow');
const {
    EVMRevert
} = require('./helpers/EVMRevert');
const { 
    assertRevert 
} = require('./helpers/assertRevert');

var Bank = artifacts.require("./Bank.sol");
var AccessAccount = artifacts.require("./AccessAccount.sol");

contract('System test', function(accounts) {

    const bankOwner = accounts[0];
    const userWallet = accounts[1];
    const accessAccountOwner = accounts[2];
    const delayAccountOwner = accounts[3];
    const trustAccountOwner = accounts[4];

    beforeEach(async function () {
        bank = await Bank.new({from: bankOwner});
    }

    it("Creating Access Account tests", async () => {
        await bank.createBankAccount(1, {from: accessAccountOwner});
        
        let bankAccountAddress = await bank.getBankAccountAddress(accessAccountOwner, {from: bankOwner});

        assert.notEqual(bankAccountAddress, 0x0, "Returned bank account address is real");
    });
})