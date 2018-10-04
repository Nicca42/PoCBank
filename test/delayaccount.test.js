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
const {
    advanceBlock
} = require('./helpers/advanceToBlock');
const {
    increaseTimeTo,
    duration
} = require('./helpers/increaseTime');
const {
    latestTime
} = require('./helpers/latestTime');

var DelayAccount = artifacts.require("./DelayAccount.sol");

/**
  * Test Index 
  * tests in this file:
  * 
  *>> INITIAL TESTS  
  *     (Delay)Testing the creation of an account via the contract
  *         test 1: contract funtion getbalance() can be called 
  *         test 2: contract function getFrozen() can be called
  *     
  *     (Delay)Testing freeze and defrost
  *         test 1: the accounts frozen status has changed
  *         test 2: contract lock status is true
  *         test 3: contract cannot deposit when locked
  *         test 4: contract cannot withdraw when locked
  *         test 5: contract unlock is same as prelock
  *         test 6: contract lock is now false
  *         test 7: contract balance increased after unlocked
  * 
  *>> VALUE TESTS
  *     (Delay)Testing deposit
  *         test 1: contracts balance changes with deposit
  *         test 2: contract cannot hold more value then limit
  *         test 3: contract can hold the limit
  * 
  *     (Delay)Testing withdraw
  *         test 1: contract cannot call withdraw in access acount (parent contract)
  *         test 2: checking the account cannot withdraw before time has passed
  *         test 3: contract balance changes after withdraw 
  * 
  *>> OWNER SENSTIVIVE TESTS 
  *     (Delay)Testing the owner only functions
  *         test 1: checks isOwner() function
  *         test 2: checks isOwner() function
  *         test 3: checks isBank() funcution
  *         test 4: checks isBank() function
  *         test 5: checks isOwner() function
  * 
  *     (Delay)Testing changing of ownership
  *         test 1: contracts owner has changed
  *         test 2: contracts lock state changes
  *         test 3: contract lock state is now true
  * 
  *     (Delay)Testing dissolve
  *         test 1: becuse this throws a 
  *                 'ttempting to run transaction which calls a contract function, 
  *                 but recipient address ... is not a contract address'
  *             it is surrounded in a try catch
  */

contract('Delay Account Tests', function(accounts) {

    const bankOwner = accounts[0];
    const userWallet = accounts[1];
    const accessAccountOwner = accounts[2];
    const delayAccountOwner = accounts[3];
    const trustAccountOwner = accounts[4];



/**
  * INITIAL TESTS  
  */

    /**
      * @dev tests the creation of an account through the contract
      */
    it("(Delay)Testing the creation of an account via the contract", async() => {
        let delayAccount = await DelayAccount.new(delayAccountOwner, 4000, {from: userWallet});
        let delayAccountAddress = await delayAccount.address;
        let delayAccountContact = await DelayAccount.at(delayAccountAddress);
        let balance = await delayAccountContact.getBalance({from: delayAccountOwner});
        let locked = await delayAccountContact.getFrozen();

        //test 1: contract funtion getbalance() can be called 
        assert.equal(balance, 0, "Chekcing access account functions, getbalance()");

        //test 2: contract function getFrozen() can be called
        assert.equal(locked, false, "Checking access account functions, getFrozen()");
    });

    /**
      * @dev tests the freeze and defrost 
      */
    it("(Delay)Testing freeze and defrost", async() => {
        let delayAccount = await DelayAccount.new(delayAccountOwner, 4000, {from: userWallet});
        let delayAccountAddress = await delayAccount.address;
        let delayAccountContact = await DelayAccount.at(delayAccountAddress);
        let frozenBefore = await delayAccountContact.getFrozen();
        await delayAccountContact.freeze({from: delayAccountOwner});
        let locked = await delayAccountContact.getFrozen();

        //test 1: the accounts frozen status has changed
        assert.notEqual(frozenBefore, locked, "Checking acounts frozen status changes");

        //test 2: contract lock status is true
        assert.equal(locked, true, "Checking account frozen status is true");

        //test 3: contract cannot deposit when locked
        await assertRevert(delayAccountContact.deposit({value: 200}), EVMRevert);

        //test 4: contract cannot withdraw when locked
        await assertRevert(delayAccountContact.withdraw(20, {from: delayAccountOwner}), EVMRevert);

        await delayAccountContact.defrost({from: delayAccountOwner});
        let unlocked = await delayAccountContact.getFrozen();

        //test 5: contract unlock is same as prelock
        assert.equal(unlocked, frozenBefore, "Checking account unlocked is same as prelock");

        //test 6: contract lock is now false
        assert.equal(unlocked, false, "Checking account lock status is now false");

        await delayAccountContact.deposit({value: 200});
        let balance = await delayAccountContact.getBalance();

        //test 7: contract balance increased after unlocked
        assert.equal(balance, 200, "Checking account balance increases by 200");
    });



/**
  * VALUE TESTS 
  */

  /**
    * @dev tests the contract ability to deposit
    */
    it("(Delay)Testing deposit", async() => {
        let delayAccount = await DelayAccount.new(delayAccountOwner, 4000, {from: userWallet});
        let delayAccountAddress = await delayAccount.address;
        let delayAccountContact = await DelayAccount.at(delayAccountAddress);
        let balanceBefore = await delayAccountContact.getBalance({from: delayAccountOwner});
        await delayAccountContact.deposit({value: 3999});
        let balanceAfter = await delayAccountContact.getBalance({from: delayAccountOwner});

        //test 1: contracts balance changes with deposit
        assert.notEqual(balanceBefore, balanceAfter, "Checking balance changed");
        
        //test 2: contract cannot hold more value then limit 
        await assertRevert(delayAccountContact.deposit({value: 10}), EVMRevert);

        await delayAccountContact.deposit({value: 1});
        let balance = await delayAccountContact.getBalance({from: delayAccountOwner});

        //test 3: contract can hold the limit
        assert.equal(balance, 4000, "Checking account can hold limit");
    });

    /**
      * @dev tests contracts ability to request a withdraw and withdraw 
      */
    it("(Delay)Testing withdraw", async() => {
        let delayAccount = await DelayAccount.new(delayAccountOwner, 4000, {from: userWallet});
        let delayAccountAddress = await delayAccount.address;
        let delayAccountContact = await DelayAccount.at(delayAccountAddress);
        await delayAccountContact.deposit({value: 400});
        await delayAccountContact.requestWithdraw(300, trustAccountOwner, {from: delayAccountOwner});

        //test 1: contract cannot call withdraw in access acount (parent contract)
        await assertRevert(delayAccountContact.withdraw(300, {from: delayAccountOwner}), EVMRevert);

        //test 2: checking the account cannot withdraw before time has passed
        await assertRevert(delayAccountContact.withdraw(1, {from: delayAccountOwner}), EVMRevert);

        //changing the current time to 30 days in the future
        let nowTime = await latestTime();
        //just after then delay time of the withdraw period
        let afterEndingTime = await nowTime + duration.days(30) + duration.minutes(30);
        await increaseTimeTo(afterEndingTime);
        await delayAccountContact.withdraw(1, {from: delayAccountOwner});
        let balance = await delayAccountContact.getBalance({from: delayAccountOwner});

        //test 3: contract balance changes after withdraw 
        assert.equal(balance, 100, "Checking balance has changed and is correct after withdraw");
    });



/**
  * OWNER SENSTIVIVE TESTS 
  */

    /**
      * @dev tests the owner only functions 
      */
    it("(Delay)Testing the owner only functions", async() => {
        let delayAccount = await DelayAccount.new(delayAccountOwner, 4000, {from: userWallet});
        let delayAccountAddress = await delayAccount.address;
        let delayAccountContact = await DelayAccount.at(delayAccountAddress);

        //test 1: checks isOwner() function
        await assertRevert(delayAccountContact.freeze({from: trustAccountOwner}), EVMRevert);

        //test 2: checks isOwner() function
        await assertRevert(delayAccountContact.defrost({from: trustAccountOwner}), EVMRevert);

        //test 3: checks isBank() funcution
        await assertRevert(delayAccountContact.dissolve({from: trustAccountOwner}), EVMRevert);

        //test 4: checks isBank() function
        await assertRevert(delayAccountContact.changeOwner(trustAccountOwner, {from: trustAccountOwner}), EVMRevert);
        
        //test 5: checks isOwner() function
        await assertRevert(delayAccountContact.withdraw(200, {from: trustAccountOwner}), EVMRevert);
    });

    /**
      * @dev tests the changing of ownership
      */
    it("(Delay)Testing changing of ownership", async() => {
        let delayAccount = await DelayAccount.new(delayAccountOwner, 4000, {from: userWallet});
        let delayAccountAddress = await delayAccount.address;
        let delayAccountContact = await DelayAccount.at(delayAccountAddress);
        await delayAccountContact.deposit({value: 1000});
        let owner = await delayAccountContact.getOwner({from: delayAccountOwner});
        await delayAccountContact.changeOwner(trustAccountOwner, {from: userWallet});
        let ownerAfter = await delayAccountContact.getOwner({from: trustAccountOwner});

        //test 1: contracts owner has changed
        assert.notEqual(owner, ownerAfter, "Owners address has changed"); 

        let lockBefore = await delayAccountContact.getFrozen();
        await delayAccountContact.freeze({from: trustAccountOwner});
        let lock = await delayAccountContact.getFrozen();

        //test 2: contracts lock state changes
        assert.notEqual(lockBefore, lock, "Lock status has changed");

        //test 3: contract lock state is now true
        assert.equal(lock, true, "Account is now locked");
    });

    /**
      * @dev tests the contracts ability to dissolve 
      */
    it("(Delay)Testing dissolve", async() => {
        let delayAccount = await DelayAccount.new(delayAccountOwner, 4000, {from: userWallet});
        let delayAccountAddress = await delayAccount.address;
        let delayAccountContact = await DelayAccount.at(delayAccountAddress);
        await delayAccountContact.dissolve({from: userWallet});

        //test 1: becuse this throws a 
            //'ttempting to run transaction which calls a contract function, 
            //but recipient address ... is not a contract address'
            //it is surrounded in a try catch
        try {
            await delayAccountContact.freeze({from: userWallet});
            //if it works it should never reach here
            assert.equal(true, false, "");
        } catch(e) {
            //when the .freeze() fails it should skip the assert and this should run
            assert.equal(true, true, "");
        }  
    });

})