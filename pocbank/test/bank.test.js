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

/**
  * @dev Tests Access account 
  */
    it("(Access)Tests the Creation of an account.", async () => {
        await bank.createBankAccount(1, {from: accessAccountOwner});
        let bankAccountAddress = await bank.getBankAccountAddress(accessAccountOwner, {from: bankOwner});

        //checking address is not blank
        assert.notEqual(bankAccountAddress, 0x0, "Returned bank account address is real");
    });

    it("(Access)Test creating account with funds.", async () => {
        await bank.createBankAccount(1, {from: accessAccountOwner, value: 1000});
        let bankAccountAddress = await bank.getBankAccountAddress(accessAccountOwner, {from: bankOwner});
        let accessAccountContact = await AccessAccount.at(bankAccountAddress);
        let bankAccountBalance = await accessAccountContact.viewBalance({from: accessAccountOwner});

        //checking address is not blank
        assert.notEqual(bankAccountAddress, 0x0, "Returned bank account address is real");
        //checking bank balance is the amount send with 
        assert.equal(bankAccountBalance, 1000, "Bank account balance is 1000");
    });

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

    it("(Access)Test the freezing of account", async() => {
        await bank.createBankAccount(1, {from: accessAccountOwner, value: 1000});
        let bankAccountAddress = await bank.getBankAccountAddress(accessAccountOwner, {from: bankOwner});
        let accessAccountContact = await AccessAccount.at(bankAccountAddress);

        let freezeSuccess = await accessAccountContact.freezeAccount.call({from: accessAccountOwner});
        consol.log(freezeSuccess + ": freeze status");
    });

/**
  * @dev Tests Delay accounts
  */
    it("Creating Delay Account test", async () => {
        await bank.createBankAccount(2, {from: delayAccountOwner});
        let bankAccountAddress = await bank.getBankAccountAddress(delayAccountOwner, {from: bankOwner});

        //checking address is not blank
        assert.notEqual(bankAccountAddress, 0x0, "Returned bank account address is real");
    });

    it("Creating Delay Account with funds tests", async () => {
        await bank.createBankAccount(2, {from: delayAccountOwner, value: 1000});
        let bankAccountAddress = await bank.getBankAccountAddress(delayAccountOwner, {from: bankOwner});

        let delayAccountContact = await AccessAccount.at(bankAccountAddress);
        let bankAccountBalance = await delayAccountContact.viewBalance({from: delayAccountOwner});

        //checking address is not blank
        assert.notEqual(bankAccountAddress, 0x0, "Returned bank account address is real");
        //checking bank balance is the amount send with 
        assert.equal(bankAccountBalance, 1000, "Bank account balance is 1000");
    });

/**
  * @dev Tests Trust accounts
  */
    it("Creating Trust Account tests", async () => {
        await bank.createBankAccount(3, {from: trustAccountOwner});
        let bankAccountAddress = await bank.getBankAccountAddress(trustAccountOwner, {from: bankOwner});

        //checking address is not blank
        assert.notEqual(bankAccountAddress, 0x0, "Returned bank account address is real");
    });

    it("Creating Trust Account with funds tests", async () => {
        await bank.createBankAccount(3, {from: trustAccountOwner, value: 1000});
        let bankAccountAddress = await bank.getBankAccountAddress(trustAccountOwner, {from: bankOwner});

        let trustAccountContact = await AccessAccount.at(bankAccountAddress);
        let bankAccountBalance = await trustAccountContact.viewBalance({from: trustAccountOwner});

        //checking address is not blank
        assert.notEqual(bankAccountAddress, 0x0, "Returned bank account address is real");
        //checking bank balance is the amount send with 
        assert.equal(bankAccountBalance, 1000, "Bank account balance is 1000");
    });

})