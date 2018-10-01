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

contract('Delay Account Tests', function(accounts) {

    const bankOwner = accounts[0];
    const userWallet = accounts[1];
    const accessAccountOwner = accounts[2];
    const delayAccountOwner = accounts[3];
    const trustAccountOwner = accounts[4];

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

    it("(Delay)Testing the freeze", async() => {
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

    it("(Delay)Testing withdraw", async() => {
        let delayAccount = await DelayAccount.new(delayAccountOwner, 4000, {from: userWallet});
        let delayAccountAddress = await delayAccount.address;
        let delayAccountContact = await DelayAccount.at(delayAccountAddress);
        await delayAccountContact.deposit({value: 3999});
        await delayAccountContact.requestWithdraw(300, trustAccountOwner, {from: delayAccountOwner});

        //test 1: contract cannot call withdraw in access acount (parent contract)
        await assertRevert(delayAccountContact.withdraw(300, {from: delayAccountOwner}), EVMRevert);

        //test 2: checking the account cannot withdraw before time has passed
        await assertRevert(delayAccountContact.withdraw(1, {from: delayAccountOwner}), EVMRevert);

        //changing the current time to 30 days in the future
        let nowTime = await latestTime();
        let afterEndingTime = await nowTime + duration.days(30);
        console.log(afterEndingTime);
        await increaseTimeTo(afterEndingTime);
        await delayAccountContact.withdraw(1, {from: delayAccountOwner});

        //test 2: contract can withdraw amount after time has passed
        
    });

})