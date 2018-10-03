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

var TrustAccount = artifacts.require("./TrustAccount.sol");
var Bank = artifacts.require("./Bank.sol");

contract('Trust Account Tests', function(accounts) {

    const bankOwner = accounts[0];
    const userWallet = accounts[1];
    const accessAccountOwner = accounts[2];
    const delayAccountOwner = accounts[3];
    const trustAccountOwnerOne = accounts[4];
    const trustAccountOwnerTwo = accounts[5];
    const trustAccountOwnerThree = accounts[6];
    const trustAccountOwnerFour = accounts[7];

    /**
      * @dev  
      */
    it("(Trust)Testing the creation of an account via the contract", async() => {
        let owners = [trustAccountOwnerOne, trustAccountOwnerTwo, trustAccountOwnerThree, trustAccountOwnerFour];
        let trustAccount = await TrustAccount.new(owners, 4000, {from: userWallet});
        let trustAccountAddress = trustAccount.address;
        let trustAccountContact = await TrustAccount.at(trustAccountAddress);
        let balance = await trustAccountContact.getBalance({from: trustAccountOwnerOne});
        let locked = await trustAccountContact.getFrozen();

        //test 1: contract can access balance
        assert.equal(balance, 0, "Chekcing access account functions, getbalance()");

        //test 2: contract can access frozen status
        assert.equal(locked, false, "CHecking access account functions, getFrozen()");
    });

    it("(Trust)Testing freeze", async() => {
        let owners = [trustAccountOwnerOne, trustAccountOwnerTwo, trustAccountOwnerThree, trustAccountOwnerFour];
        let trustAccount = await TrustAccount.new(owners, 4000, {from: userWallet});
        let trustAccountAddress = trustAccount.address;
        let trustAccountContact = await TrustAccount.at(trustAccountAddress);
        let lock = await trustAccountContact.getFrozen();

        await trustAccountContact.freeze({from: trustAccountOwnerTwo});
        let locked = await trustAccountContact.getFrozen();

        //test 1: the accounts frozen status has changed
        assert.notEqual(lock, locked, "Checking acounts frozen status changes");

        //test 2: contract lock status is true
        assert.equal(locked, true, "Checking account frozen status is true");

        //test 3: contract cannot deposit when locked
        await assertRevert(trustAccountContact.deposit({value: 200}), EVMRevert);

        //test 4: contract cannot withdraw when locked
        await assertRevert(trustAccountContact.withdraw(20, {from: delayAccountOwner}), EVMRevert);

        await trustAccountContact.defrost({from: trustAccountOwnerTwo});
        let unlocked = await trustAccountContact.getFrozen();

        //test 5: contract unlock is same as prelock
        assert.equal(unlocked, lock, "Checking account unlocked is same as prelock");

        //test 6: contract lock is now false
        assert.equal(unlocked, false, "Checking account lock status is now false");

        await trustAccountContact.deposit({value: 200});
        let balance = await trustAccountContact.getBalance();

        //test 7: contract balance increased after unlocked
        assert.equal(balance, 200, "Checking account balance increases by 200");
    });

    it("(Trust)Testing deposit", async() => {
        let owners = [trustAccountOwnerOne, trustAccountOwnerTwo, trustAccountOwnerThree, trustAccountOwnerFour];
        let trustAccount = await TrustAccount.new(owners, 4000, {from: userWallet});
        let trustAccountAddress = trustAccount.address;
        let trustAccountContact = await TrustAccount.at(trustAccountAddress);
        let balanceBefore = await trustAccountContact.getBalance({from: trustAccountOwnerOne});
        await trustAccountContact.deposit({value: 3999});
        let balanceAfter = await trustAccountContact.getBalance({from: trustAccountOwnerTwo});

        //test 1: contracts balance changes with deposit
        assert.notEqual(balanceBefore, balanceAfter, "Checking balance changed");
        
        //test 2: contract cannot hold more value then limit 
        await assertRevert(trustAccountContact.deposit({value: 10}), EVMRevert);

        await trustAccountContact.deposit({value: 1});
        let balance = await trustAccountContact.getBalance({from: trustAccountOwnerTwo});

        //test 3: contract can hold the limit
        assert.equal(balance, 4000, "Checking account can hold limit");
    });

    it("(Trust)Testing vote on adding owner", async() => {
        let owners = [trustAccountOwnerOne, trustAccountOwnerTwo, trustAccountOwnerThree, trustAccountOwnerFour];
        let trustAccount = await TrustAccount.new(owners, 4000, {from: userWallet});
        let trustAccountAddress = trustAccount.address;
        let trustAccountContact = await TrustAccount.at(trustAccountAddress);
        await trustAccountContact.addOwnerRequest(accessAccountOwner, {from: trustAccountOwnerThree});
        
        await trustAccountContact.voteFor(0, true, {from: trustAccountOwnerOne});
        await trustAccountContact.voteFor(0, true, {from: trustAccountOwnerTwo});
        await trustAccountContact.voteFor(0, true, {from: trustAccountOwnerThree});
        await trustAccountContact.voteFor(0, true, {from: trustAccountOwnerFour});

        let nowTime = await latestTime();
        let afterEndingTime = await nowTime + duration.days(3) + duration.minutes(3);
        await increaseTimeTo(afterEndingTime);
        await trustAccountContact.addOwner(0, {from: trustAccountOwnerThree});
        let balance = await trustAccountContact.getBalance.call({from: accessAccountOwner});

        //test 1: contract has added new owner, and the new owner can access all owner functions
        assert.equal(balance["c"][0], 0, "Checking added owner has been added");
    });

    it("(Trust)Testing vote on removing owner", async() => {
        let owners = [trustAccountOwnerOne, trustAccountOwnerTwo, trustAccountOwnerThree, trustAccountOwnerFour];
        let trustAccount = await TrustAccount.new(owners, 4000, {from: userWallet});
        let trustAccountAddress = trustAccount.address;
        let trustAccountContact = await TrustAccount.at(trustAccountAddress);
        await trustAccountContact.removeOwnerRequest(trustAccountOwnerTwo, {from: trustAccountOwnerThree});
        await trustAccountContact.voteFor(0, true, {from: trustAccountOwnerOne});
        await trustAccountContact.voteFor(0, true, {from: trustAccountOwnerThree});
        await trustAccountContact.voteFor(0, true, {from: trustAccountOwnerFour});
        let nowTime = await latestTime();
        let afterEndingTime = await nowTime + duration.days(3) + duration.minutes(3);
        await increaseTimeTo(afterEndingTime);
        await trustAccountContact.removeOwner(0, {from: trustAccountOwnerThree});

        //test 1: contract owner senstitive functions cannot be called by old owner
        await assertRevert(trustAccountContact.getOwner({from: trustAccountOwnerTwo}), EVMRevert);
    });

    it("(Trust)Testing vote on changing owner", async() => {
        let owners = [trustAccountOwnerOne, trustAccountOwnerTwo, trustAccountOwnerThree, trustAccountOwnerFour];
        let trustAccount = await TrustAccount.new(owners, 4000, {from: userWallet});
        let trustAccountAddress = trustAccount.address;
        let trustAccountContact = await TrustAccount.at(trustAccountAddress);
        await trustAccountContact.requestChangeOwnerAddress(trustAccountOwnerTwo, accessAccountOwner, {from: trustAccountOwnerThree});
        await trustAccountContact.voteFor(0, true, {from: trustAccountOwnerOne});
        await trustAccountContact.voteFor(0, true, {from: trustAccountOwnerThree});
        await trustAccountContact.voteFor(0, true, {from: trustAccountOwnerFour});
        let nowTime = await latestTime();
        let afterEndingTime = await nowTime + duration.days(3) + duration.minutes(3);
        await increaseTimeTo(afterEndingTime);
        await trustAccountContact.changeOwnerAddress(0, {from: trustAccountOwnerThree});
        let balance = await trustAccountContact.getBalance({from: accessAccountOwner});

        //test 1: contract owner senstitive functions cannot be called by old owner
        await assertRevert(trustAccountContact.getOwner({from: trustAccountOwnerTwo}), EVMRevert);

        //test 2: contract owner sensitive functions can be called by new owner
        assert.equal(balance["c"][0], 0, "Checking account can be accessed by new owner");
    });

    it("(Trust)Testing vote on withdraw", async() => {
        let owners = [trustAccountOwnerOne, trustAccountOwnerTwo, trustAccountOwnerThree, trustAccountOwnerFour];
        let trustAccount = await TrustAccount.new(owners, 4000, {from: userWallet});
        let trustAccountAddress = trustAccount.address;
        let trustAccountContact = await TrustAccount.at(trustAccountAddress);
        await trustAccountContact.deposit({value: 300});
        let balance = await trustAccountContact.getBalance({from: trustAccountOwnerTwo});
        await trustAccountContact.requestWithdraw(trustAccountOwnerThree, 200, {from: trustAccountOwnerThree});
        await trustAccountContact.voteFor(0, true, {from: trustAccountOwnerOne});
        await trustAccountContact.voteFor(0, true, {from: trustAccountOwnerTwo});
        await trustAccountContact.voteFor(0, true, {from: trustAccountOwnerThree});
        await trustAccountContact.voteFor(0, true, {from: trustAccountOwnerFour});
        let nowTime = await latestTime();
        let afterEndingTime = await nowTime + duration.days(3) + duration.minutes(3);
        await increaseTimeTo(afterEndingTime);
        await trustAccountContact.withdraw(0, {from: trustAccountOwnerThree});
        let balanceAfter = await trustAccountContact.getBalance({from: trustAccountOwnerTwo});

        //test 1: contract balance and balance after withdraw are different
        assert.notEqual(balance, balanceAfter, "Checking account balance changes");

        //test 2: contract balance reduced by amount withdrawn
        assert.equal(balanceAfter["c"][0], 100, "Checking balance after changes by withdraw");
    });

    it("(Trust)Testing vote fail revert", async() => {
        let owners = [trustAccountOwnerOne, trustAccountOwnerTwo, trustAccountOwnerThree, trustAccountOwnerFour];
        let trustAccount = await TrustAccount.new(owners, 4000, {from: userWallet});
        let trustAccountAddress = trustAccount.address;
        let trustAccountContact = await TrustAccount.at(trustAccountAddress);
        await trustAccountContact.deposit({value: 300});
        let balance = await trustAccountContact.getBalance({from: trustAccountOwnerFour});
        await trustAccountContact.requestWithdraw(trustAccountOwnerThree, 200, {from: trustAccountOwnerThree});
        await trustAccountContact.voteFor(0, false, {from: trustAccountOwnerOne});
        await trustAccountContact.voteFor(0, false, {from: trustAccountOwnerTwo});
        await trustAccountContact.voteFor(0, true, {from: trustAccountOwnerThree});
        await trustAccountContact.voteFor(0, false, {from: trustAccountOwnerFour});
        let nowTime = await latestTime();
        let afterEndingTime = await nowTime + duration.days(3) + duration.minutes(3);
        await increaseTimeTo(afterEndingTime);

        //test 1: contract reverts on failed withdraw request
        await assertRevert(trustAccountContact.withdraw(0, {from: trustAccountOwnerThree}), EVMRevert);

        let balanceAfter = await trustAccountContact.getBalance({from: trustAccountOwnerFour});

        //test 2: contract balance reduced by amount withdrawn
        assert.notEqual(balanceAfter["c"][0], 100, "Checking account balance changes");

        //test 3: contract balance before and alfter failed withdraw request are equal
        assert.equal(balance["c"][0], balanceAfter["c"][0], "Checking balance after changes by withdraw");
    });

    /**
      * @dev checks all functions that the trust account has that are restricted to the owners
      * @notice the creation call TrustAccount.new() is done by bankOwner, as the bank address
      *     is considered an owner in all circumstances.
      */
    it("(Trust)Testing the owner only functions", async() => {
        let owners = [trustAccountOwnerOne, trustAccountOwnerTwo, trustAccountOwnerThree, trustAccountOwnerFour];
        let trustAccount = await TrustAccount.new(owners, 4000, {from: bankOwner});
        let trustAccountAddress = trustAccount.address;
        let trustAccountContact = await TrustAccount.at(trustAccountAddress);
        await trustAccountContact.deposit({value: 1000});

        //test 1: contract denites access to remove owner function
        await assertRevert(trustAccountContact.removeOwner(0, {from: userWallet}), EVMRevert);

        //test 2: contract denites access to add owner function
        await assertRevert(trustAccountContact.addOwner(0, {from: userWallet}), EVMRevert);

        //test 3: contract denies access to change owner fucntion for bank
        await assertRevert(trustAccountContact.changeOwner(trustAccountOwnerOne, userWallet, {from: userWallet}), EVMRevert);

        //test 4: contract denites access to change owner function 
        await assertRevert(trustAccountContact.changeOwnerAddress(0, {from: userWallet}), EVMRevert);

        //test 5: contract deinies access to withdraw function
        await assertRevert(trustAccountContact.withdraw(0, {from: userWallet}), EVMRevert);

        //test 6: contract denies access to voting function
        await assertRevert(trustAccountContact.voteFor(0, true, {from: userWallet}), EVMRevert);

        // await assertRevert(trustAccountContact.removeOwnerRequest(trustAccountOwnerTwo, {from: userWallet}), EVMRevert);

        // await assertRevert(trustAccountContact.addOwnerRequest(userWallet, {from: userWallet}), EVMRevert);

        // await assertRevert(trustAccountContact.requestChangeOwnerAddress(trustAccountOwnerOne, userWallet, {from: userWallet}), EVMRevert);

        // await assertRevert(trustAccountContact.requestWithdraw(userWallet, 500, {from: userWallet}), EVMRevert);

        // await assertRevert(trustAccountContact.getOwner({from: userWallet}), EVMRevert);

        // await assertRevert(trustAccountContact.getLimit({from: userWallet}), EVMRevert);

        // await assertRevert(trustAccountContact.freeze({from: userWallet}), EVMRevert);

        // await assertRevert(trustAccountContact.defrost({from: userWallet}), EVMRevert);
    });

    it("(Trust)Testing dissolve", async() => {
        bank = await Bank.new({from: bankOwner});
        let bankAddress = bank.address;
        let bankContract = await Bank.at(bankAddress);
        let owners = [trustAccountOwnerOne, trustAccountOwnerTwo, trustAccountOwnerThree, trustAccountOwnerFour];
        let trustAccount = await TrustAccount.new(owners, 4000, {from: bankOwner});
        let trustAccountAddress = trustAccount.address;
        let trustAccountContact = await TrustAccount.at(trustAccountAddress);
        await trustAccountContact.deposit({value: 400});
        trustAccountContact.dissolve({from: bankOwner});
        
        //test 1: becuse this throws an:
                //'attempting to run transaction which calls a contract function, 
                //but recipient address ... is not a contract address'
            //it is surrounded in a try catch
            try {
                await trustAccountContact.freeze({from: bankOwner});
                //if it works it should never reach here
                assert.equal(true, false, "");
            } catch(e) {
                //when the .freeze() fails it should skip the assert and this should run
                assert.equal(true, true, "");
            }

            let bankBalance = await bankContract.getBalance({from: bankOwner});

            assert.equal(bankBalance["c"][0], 0, "Checking balance of contract is 0, and contract value is distributed");
    });
})