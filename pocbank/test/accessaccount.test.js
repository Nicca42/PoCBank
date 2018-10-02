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

var AccessAccount = artifacts.require("./AccessAccount.sol");

/**
  * Test Index 
  * tests in this file:
  * 
  * (Access)Testing the creation of an account via the contract
  *     test 1: contract can access balance
  *     test 2: contract can access frozen status
  * 
  * (Access)Testing freeze
  *     test 1: contract lock state changes
  *     test 2: contract lock state is locked (true)
  *     test 3: contract cannot deposit when locked
  *     test 4: contract cannot withdraw when locked
  *     test 5: contract unlocked is the same as pre lock
  *     test 6: contract lock status is now false 
  *     test 7: contract balance increased after unlocked
  * 
  * (Access)Testing deposit
  *     test 1: contracts balance changes with deposit
  *     test 2: contract cannot hold more value then limit 
  *     test 3: contract can hold the limit
  * 
  * (Access)Testing withdraw
  *     test 1: contract can be deposited into
  *     test 2: contract can be withdrawn from
  * 
  * (Access)Testing the owner only functions
  *     test 2: checks isOwner() function
  *     test 3: checks isOwner() function
  *     test 4: checks isBank() funcution
  *     test 5: checks isBank() function
  *     test 6: checks isOwner() function
  * 
  * (Access)Testing changing of ownership
  *     test 1: contracts owner has changed
  *     test 2: contracts lock state changes
  *     test 3: contract lock state is now true
  * 
  * (Access)Testing dissolve
  *     test 1: becuse this throws an:
  *             'attempting to run transaction which calls a contract function, 
  *             but recipient address ... is not a contract address'
  *         it is surrounded in a try catch  
  */

contract('Access Account Tests', function(accounts) {

    const bankOwner = accounts[0];
    const userWallet = accounts[1];
    const accessAccountOwner = accounts[2];
    const delayAccountOwner = accounts[3];
    const trustAccountOwner = accounts[4];

    it("(Access)Testing the creation of an account via the contract", async() => {
        let accessAccount = await AccessAccount.new(accessAccountOwner, 0, 4000, {from: userWallet});
        let accessAccountAddress = accessAccount.address;
        let accessAccountContact = await AccessAccount.at(accessAccountAddress);
        let balance = await accessAccountContact.getBalance({from: accessAccountOwner});
        let locked = await accessAccountContact.getFrozen();

        //test 1: contract can access balance
        assert.equal(balance, 0, "Chekcing access account functions, getbalance()");

        //test 2: contract can access frozen status
        assert.equal(locked, false, "Checking access account functions, getFrozen()");
    });

    it("(Access)Testing freeze", async() => {
        let accessAccount = await AccessAccount.new(accessAccountOwner, 0, 4000, {from: userWallet});
        let accessAccountAddress = await accessAccount.address;
        let accessAccountContact = await AccessAccount.at(accessAccountAddress);

        let lockedBefore = await accessAccountContact.getFrozen();
        await accessAccountContact.freeze({from: userWallet});
        let locked = await accessAccountContact.getFrozen();

        //test 1: contract lock state changes
        assert.notEqual(lockedBefore, locked, "Chekcing the contracts lock state changes");

        //test 2: contract lock state is locked (true)
        assert.equal(locked, true, "Checking lock status is true")

        //test 3: contract cannot deposit when locked
        await assertRevert(accessAccountContact.deposit({value: 200}), EVMRevert);

        //test 4: contract cannot withdraw when locked
        await assertRevert(accessAccountContact.withdraw(20, {from: accessAccountOwner}), EVMRevert);

        await accessAccountContact.defrost({from: userWallet});
        let unlocked = await accessAccountContact.getFrozen();

        //test 5: contract unlocked is the same as pre lock
        assert.equal(lockedBefore, unlocked, "Checking the contract can be unlocked to the same state");

        //test 6: contract lock status is now false 
        assert.equal(unlocked, false, "Checking lock status is false");

        await accessAccountContact.deposit({value: 200});
        let balance = await accessAccountContact.getBalance();

        //test 7: contract balance increased after unlocked
        assert.equal(balance, 200, "Checking account balance increases by 200");
    });

    it("(Access)Testing deposit", async() => {
        let accessAccount = await AccessAccount.new(accessAccountOwner, 0, 4000, {from: userWallet});
        let accessAccountAddress = await accessAccount.address;
        let accessAccountContact = await AccessAccount.at(accessAccountAddress);
        let balanceBefore = await accessAccountContact.getBalance({from: accessAccountOwner});
        await accessAccountContact.deposit({value: 3999});
        let balanceAfter = await accessAccountContact.getBalance({from: accessAccountOwner});

        //test 1: contracts balance changes with deposit
        assert.notEqual(balanceBefore, balanceAfter, "Checking balance changed");
        
        //test 2: contract cannot hold more value then limit 
        await assertRevert(accessAccountContact.deposit({value: 10}), EVMRevert);

        await accessAccountContact.deposit({value: 1});
        let balance = await accessAccountContact.getBalance({from: accessAccountOwner});

        //test 3: contract can hold the limit
        assert.equal(balance, 4000, "Checking account can hold limit");
    });

    it("(Access)Testing withdraw", async() => {
        let accessAccount = await AccessAccount.new(accessAccountOwner, 0, 4000, {from: userWallet});
        let accessAccountAddress = await accessAccount.address;
        let accessAccountContact = await AccessAccount.at(accessAccountAddress);
        let balanceBefore = await accessAccountContact.getBalance({from: accessAccountOwner});
        await accessAccountContact.deposit({value: 1000});
        let balanceAfter = await accessAccountContact.getBalance({from: accessAccountOwner});
        await accessAccountContact.withdraw(200, {from: accessAccountOwner});
        let balance = await accessAccountContact.getBalance({from: accessAccountOwner});

        //test 1: contract can be deposited into
        assert.notEqual(balanceBefore, balanceAfter, "Checing balance changed with deposit");

        //test 2: contract can be withdrawn from
        assert.equal(balance, 1000-200, "Checking balance can be changed with withdraw");
    });

    it("(Access)Testing the owner only functions", async() => {
        let accessAccount = await AccessAccount.new(accessAccountOwner, 0, 4000, {from: userWallet});
        let accessAccountAddress = await accessAccount.address;
        let accessAccountContact = await AccessAccount.at(accessAccountAddress);

        //test 2: checks isOwner() function
        await assertRevert(accessAccountContact.freeze({from: trustAccountOwner}), EVMRevert);

        //test 3: checks isOwner() function
        await assertRevert(accessAccountContact.defrost({from: trustAccountOwner}), EVMRevert);

        //test 4: checks isBank() funcution
        await assertRevert(accessAccountContact.dissolve({from: trustAccountOwner}), EVMRevert);

        //test 5: checks isBank() function
        await assertRevert(accessAccountContact.changeOwner(trustAccountOwner, {from: trustAccountOwner}), EVMRevert);

        //test 6: checks isOwner() function
        await assertRevert(accessAccountContact.withdraw(200, {from: trustAccountOwner}), EVMRevert);
    });

    it("(Access)Testing changing of ownership", async() => {
        let accessAccount = await AccessAccount.new(accessAccountOwner, 0, 4000, {from: userWallet});
        let accessAccountAddress = await accessAccount.address;
        let accessAccountContact = await AccessAccount.at(accessAccountAddress);
        await accessAccountContact.deposit({value: 1000});
        let owner = await accessAccountContact.getOwner({from: accessAccountOwner});
        await accessAccountContact.changeOwner(trustAccountOwner, {from: userWallet});
        let ownerAfter = await accessAccountContact.getOwner({from: trustAccountOwner});

        //test 1: contracts owner has changed
        assert.notEqual(owner, ownerAfter, "Owners address has changed"); 

        let lockBefore = await accessAccountContact.getFrozen();
        await accessAccountContact.freeze({from: trustAccountOwner});
        let lock = await accessAccountContact.getFrozen();

        //test 2: contracts lock state changes
        assert.notEqual(lockBefore, lock, "Lock status has changed");

        //test 3: contract lock state is now true
        assert.equal(lock, true, "Account is now locked");
    });

    it("(Access)Testing dissolve", async() => {
        let accessAccount = await AccessAccount.new(accessAccountOwner, 0, 4000, {from: userWallet});
        let accessAccountAddress = await accessAccount.address;
        let accessAccountContact = await AccessAccount.at(accessAccountAddress);
        await accessAccountContact.dissolve({from: userWallet});

        //test 1: becuse this throws an
            //'attempting to run transaction which calls a contract function, 
            //but recipient address ... is not a contract address'
            //it is surrounded in a try catch
        try {
            await accessAccountContact.freeze({from: userWallet});
            //if it works it should never reach here
            assert.equal(true, false, "");
        } catch(e) {
            //when the .freeze() fails it should skip the assert and this should run
            assert.equal(true, true, "");
        }  
    });

})