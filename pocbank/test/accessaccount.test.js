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

    // beforeEach(async function () {
    //     bank = await Bank.new({from: bankOwner});
    //     // let bankAddress = bank.address;
    // });

    it("(Access)Testing the creation of an account via the contract", async() => {
        let accessAccount = await AccessAccount.new(accessAccountOwner, 1, 4000, {from: userWallet});
        let accessAccountAddress = accessAccount.address;
        let accessAccountContact = await AccessAccount.at(accessAccountAddress);

        let balance = await accessAccountContact.getBalance({from: accessAccountOwner});
        let locked = await accessAccountContact.getFrozen();

        assert.equal(balance, 0, "Chekcing access account functions, getbalance()");
        assert.equal(locked, false, "CHecking access account functions, getFrozen()");
    });

    it("(Access)Testing freeze", async() => {
        let accessAccount = await AccessAccount.new(accessAccountOwner, 1, 4000, {from: userWallet});
        let accessAccountAddress = accessAccount.address;
        let accessAccountContact = await AccessAccount.at(accessAccountAddress);

        let lockedBefore = await accessAccountContact.getFrozen();
        await accessAccountContact.freeze({from: userWallet});
        let locked = await accessAccountContact.getFrozen();

        //test 1: contract lock state changes
        assert.notEqual(lockedBefore, locked, "Chekcing the contracts lock state changes");
        //test 2: contract lock state is locked (true)
        assert.equal(locked, true, "Checking lock status is true")

        //test 3: contract cannot deposit when locked
        assertRevert(accessAccountContact.deposit({value: 200}), EVMRevert);
        //test 4: contract cannot withdraw when locked
        assertRevert(accessAccountContact.withdraw(20, {from: accessAccountOwner}), EVMRevert);

        await accessAccountContact.defrost({from: userWallet});
        let unlocked = await accessAccountContact.getFrozen();

        assert.equal(lockedBefore, unlocked, "Checking the contract can be unlocked to the same state");
        assert.equal(unlocked, false, "Checking lock status is false");
    });

    it("(Access)Testing deposit", async() => {
        let accessAccount = await AccessAccount.new(accessAccountOwner, 1, 4000, {from: userWallet});
        let accessAccountAddress = accessAccount.address;
        let accessAccountContact = await AccessAccount.at(accessAccountAddress);

        let balanceBefore = await accessAccountContact.getBalance({from: accessAccountOwner});
        await accessAccountContact.deposit({value: 3999});
        let balanceAfter = await accessAccountContact.getBalance({from: accessAccountOwner});

        //test 1: contracts balance changes with deposit
        assert.notEqual(balanceBefore, balanceAfter, "Checking balance changed");
        
        //test 2: contract cannot hold more value then limit 
        assertRevert(accessAccountContact.deposit({value: 10}), EVMRevert);

        await accessAccountContact.deposit({value: 1});
        let balance = await accessAccountContact.getBalance({from: accessAccountOwner});

        //test 3: contract can hold the limit
        assert.equal(balance, 4000, "Checking account can hold limit");
    });

    it("(Access)Testing withdraw", async() => {
        let accessAccount = await AccessAccount.new(accessAccountOwner, 1, 4000, {from: userWallet});
        let accessAccountAddress = accessAccount.address;
        let accessAccountContact = await AccessAccount.at(accessAccountAddress);
        console.log("1");
        let balanceBefore = await accessAccountContact.getBalance({from: accessAccountOwner});
        await accessAccountContact.deposit({value: 1000});
        let balanceAfter = await accessAccountContact.getBalance({from: accessAccountOwner});
        console.log("2");
        console.log(balanceAfter)
        await accessAccountContact.withdraw(200, {from: accessAccountOwner});
        let balance = await accessAccountContact.getBalance({from: accessAccountOwner});
        
        console.log("3");

        //test 1: contract can be deposited into
        assert.notEqual(balanceBefore, balanceAfter, "Checing balance changed with deposit");

        //test 2: contract can be withdrawn from
        assert.equal(balance, 1000-200, "Checking balance can be changed with withdraw");
    });

    it("(Access)Testing the owner only functions", async() => {
        let accessAccount = await AccessAccount.new(accessAccountOwner, 1, 4000, {from: userWallet});
        let accessAccountAddress = accessAccount.address;
        let accessAccountContact = await AccessAccount.at(accessAccountAddress);

        let balance = await accessAccountContact.getBalance({from: accessAccountOwner});

        //test 1: contract 
        assertRevert(accessAccountContact.getBalance({from: trustAccountOwner}), EVMRevert);
    });

})