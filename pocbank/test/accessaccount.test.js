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

contract('Access Account Tests', function(accounts) {

    const bankOwner = accounts[0];
    const userWallet = accounts[1];
    const accessAccountOwner = accounts[2];
    const delayAccountOwner = accounts[3];
    const trustAccountOwner = accounts[4];

    /**
      * Test structure:
      *     Test Labes:
      *         (<account being tested>)Test <what is being tested>.
      *         E.g: (Access)Tests the creation of account
      * 
      *     All tests:
      *
      *  (Access)Tests the Creation of an account.
      *  (Access)Test creating account with funds.
      *  (Access)Test the deposit.
      *  (Access)Test the withdraw of an acount.
      *  
      *  
      */

    beforeEach(async function () {
        bank = await Bank.new({from: bankOwner});
    })

    it("(Access)Test the deposit.", async() => {
        await bank.createBankAccount(1, {from: accessAccountOwner});
        let bankAccountAddress = await bank.getBankAccountAddress(accessAccountOwner, {from: bankOwner});
        let accessAccountContact = await AccessAccount.at(bankAccountAddress);
        let bankAccountBalanceBefore = await accessAccountContact.viewBalance({from: accessAccountOwner});
        await accessAccountContact.deposit(100, {value: 100});
        let bankAccountBalanceAfter = await accessAccountContact.viewBalance({from: accessAccountOwner});

        //checks the balances are different
        assert.notEqual(bankAccountBalanceBefore, bankAccountBalanceAfter, "Balance changes with deposit");
        //checks the balance after is 100
        assert.equal(bankAccountBalanceBefore + 100, 100, "Balance changes by 100");
        //checks the amount after is 100
        assert.equal(bankAccountBalanceAfter, 100, "Amount after deposit is 100");
    });

    it("(Access)Test the withdraw of an acount.", async() => {
        await bank.createBankAccount(1, {from: accessAccountOwner, value: 1000});
        let bankAccountAddress = await bank.getBankAccountAddress(accessAccountOwner, {from: bankOwner});
        let accessAccountContact = await AccessAccount.at(bankAccountAddress);
        let bankAccountBalance = await accessAccountContact.viewBalance({from: accessAccountOwner});
        await accessAccountContact.withdraw(100, {from: accessAccountOwner});
        let bankAccountBalanceAfter = await accessAccountContact.viewBalance({from: accessAccountOwner});

        //checks the balance is changed after withdraw
        assert.notEqual(bankAccountBalance, bankAccountBalanceAfter, "Balance changes when 100 withdrawn");
        //checks the balanced changed by 100
        assert.equal(bankAccountBalance - 100, bankAccountBalanceAfter, "Balance changes by 100");
    });

    it("(Access)Test the freezing of account.", async() => {
        await bank.createBankAccount(1, {from: accessAccountOwner, value: 1000});
        let bankAccountAddress = await bank.getBankAccountAddress(accessAccountOwner, {from: bankOwner});
        let accessAccountContact = await AccessAccount.at(bankAccountAddress);
        await accessAccountContact.freezeAccount({from: accessAccountOwner});
        
        //checks the withdraw function fails when account is frozen
        await expectThrow( accessAccountContact.withdraw(100, {from: accessAccountOwner}), EVMRevert);
    });

    it("(Access)Test the unfreezing of an account.", async() => {
        await bank.createBankAccount(1, {from: accessAccountOwner, value: 1000});
        let bankAccountAddress = await bank.getBankAccountAddress(accessAccountOwner, {from: bankOwner});
        let accessAccountContact = await AccessAccount.at(bankAccountAddress);
        let balanceBefore = await accessAccountContact.viewBalance({from: accessAccountOwner});
        await accessAccountContact.freezeAccount({from: accessAccountOwner});
        
        //checks the withdraw function fails when account is frozen
        await expectThrow( accessAccountContact.withdraw(100, {from: accessAccountOwner}), EVMRevert);

        await accessAccountContact.unfreezeAccount({from: accessAccountOwner});
        await accessAccountContact.withdraw(100, {from: accessAccountOwner});
        let balanceAfter = await accessAccountContact.viewBalance({from: accessAccountOwner});

        //checks the withdraw fucntion works after unlock
        assert.equal(balanceAfter, balanceBefore -100, "Can use account after unlock");
    });

    it("(Access)Test the account cannot be frozen when frozen, or visa versa.", async() => {
        await bank.createBankAccount(1, {from: accessAccountOwner, value: 1000});
        let bankAccountAddress = await bank.getBankAccountAddress(accessAccountOwner, {from: bankOwner});
        let accessAccountContact = await AccessAccount.at(bankAccountAddress);
        let balanceBefore = await accessAccountContact.viewBalance({from: accessAccountOwner});
        await accessAccountContact.freezeAccount({from: accessAccountOwner});
        
        //checks the withdraw function fails when account is frozen
        await expectThrow(accessAccountContact.withdraw(100, {from: accessAccountOwner}), EVMRevert);

        //checks the account cannot be frozen when already frozen 
        await expectThrow(accessAccountContact.freezeAccount({from: accessAccountOwner}));

        await accessAccountContact.unfreezeAccount({from: accessAccountOwner});

        //checks account cannot be unfrozen if already unfrozen
        await expectThrow(accessAccountContact.unfreezeAccount({from: accessAccountOwner}));
    });
})