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

var TrustAccount = artifacts.require("./TrustAccount.sol");

contract('Trust Account Tests', function(accounts) {

    const bankOwner = accounts[0];
    const userWallet = accounts[1];
    const accessAccountOwner = accounts[2];
    const delayAccountOwner = accounts[3];
    const trustAccountOwnerOne = accounts[4];
    const trustAccountOwnerTwo = accounts[5];
    const trustAccountOwnerThree = accounts[6];
    const trustAccountOwnerFour = accounts[7];

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

    it("(Tust)Testing vote on withdraw/adding owner/removing owner", async() => {

    });

    it("(Trust)Testing withdraw", async() => {

    });

    it("(Trust)Testing the owner only functions", async() => {

    });

    it("(Trust)Testing the changing of ownership", async() => {

    });

    it("(Trust)Testing dissolve", async() => {

    });
})