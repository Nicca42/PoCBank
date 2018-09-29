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
        console.log("Created bank...>>>");
    })

    /**
     * @dev tests the creatio of a new access account 
     */
    it("Creating Access Account tests", async () => {
        await bank.createBankAccount(1, {from: accessAccountOwner});
        let bankAccountAddress = await bank.getBankAccountAddress(accessAccountOwner, {from: bankOwner});

        //checking address is not blank
        assert.notEqual(bankAccountAddress, 0x0, "Returned bank account address is real");
    });

    it("Creating Access Account with funds tests", async () => {
        await bank.createBankAccount(1, {from: accessAccountOwner, value: 1000});
        let bankAccountAddress = await bank.getBankAccountAddress(accessAccountOwner, {from: bankOwner});

        let accessAccountContact = await AccessAccount.at(bankAccountAddress);
        let bankAccountBalance = await accessAccountContact.viewBalance({from: accessAccountOwner});

        //checking address is not blank
        assert.notEqual(bankAccountAddress, 0x0, "Returned bank account address is real");
        //checking bank balance is the amount send with 
        assert.equal(bankAccountBalance, 1000, "Bank account balance is 1000");
    });

    it("", async () => {
        
    });
})