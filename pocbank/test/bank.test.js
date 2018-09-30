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

contract('Bank Tests', function(accounts) {

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

    it("(Access)Test freezing account by bank.", async() => {
        await bank.createBankAccount(1, {from: accessAccountOwner, value: 1000});
        let bankAccountAddress = await bank.getBankAccountAddress(accessAccountOwner, {from: bankOwner});
        let accessAccountContact = await AccessAccount.at(bankAccountAddress);
        await bank.lockAddress(accessAccountOwner, {from: bankOwner});
        
        //checks the withdraw function fails when account is frozen
        await expectThrow(accessAccountContact.withdraw(100, {from: accessAccountOwner}), EVMRevert);
    });

    it("(Access)Test unfreezing acount by bank.", async() => {
        await bank.createBankAccount(1, {from: accessAccountOwner, value: 1000});
        let bankAccountAddress = await bank.getBankAccountAddress(accessAccountOwner, {from: bankOwner});
        let accessAccountContact = await AccessAccount.at(bankAccountAddress);

        let balance = await accessAccountContact.viewBalance({from: accessAccountOwner});
        console.log(balance);
        await bank.lockAddress(accessAccountOwner, {from: bankOwner});
        
        //checks the withdraw function fails when account is frozen
        await expectThrow(accessAccountContact.withdraw(100, {from: accessAccountOwner}), EVMRevert);

        await bank.unlockAddress(accessAccountOwner, {from: bankOwner});
        await accessAccountContact.withdraw(100, {from: accessAccountOwner});
        let balanceAfter = await accessAccountContact.viewBalance({from: accessAccountOwner});
        console.log(balanceAfter);

        //checks the account is unfrozen and trasactions can occur
        assert.equal(balance["c"][0] - 100, balanceAfter, "Account can perform transactions after unfreezing");
    });

    
    it("(Bank)Test the ability to change owner for access account", async() => {
        await bank.createBankAccount(1, {from: accessAccountOwner, value: 1000});
        let bankAccountAddress = await bank.getBankAccountAddress(accessAccountOwner, {from: bankOwner});
        let accessAccountContact = await AccessAccount.at(bankAccountAddress);
        console.log("<<<...before getting balance");
        let balance = await accessAccountContact.viewBalance({from: accessAccountOwner});
        console.log("<<<... after getting balance: ");
        console.log(balance);
        await bank.changeOwnership(userWallet, accessAccountOwner);
        console.log("<<<... after changing ownership");
        assertRevert(accessAccountContact.viewBalance({from: accessAccountOwner}), EVMRevert);
        console.log("<<<... After checking it reverts on calling from old address");
        let balanceAfter = await accessAccountContact.viewBalance({from: userWallet});
        console.log("<<<... getting balance off new user");
        assert.equal(balance, balanceAfter, "Can access balance with new account owner");
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