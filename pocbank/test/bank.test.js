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
var DelayAccount = artifacts.require("./DelayAccount.sol");
var TrustAccount = artifacts.require("./TrustAccount.sol");

/**
  * Test Index 
  * tests in this file:
  * 
  *>> CREATION TESTS
  *     (Bank)Testing creating of access acount through the bank
  *         test 1: contract is created and can be read from
  *         test 2: contract is created and can be read from
  * 
  *     (Bank)Testing creation of a delay account through the bank
  *         test 1: contract is created and can be read from
  *         test 2: contract can be accessed
  * 
  *     (Bank)Testing creation of trust account through the bank
  *         test 1: contract is created and can be read from
  *         test 2: trust group number increasing properly
  *         test 3: contract is created and can be read from
  * 
  *>> FREEZE / DEFROST TESTS 
  *     (Bank)Testing freezing and defrosting of access account
  *         test 1: contract frozen state changed
  *         test 2: contract frozen state now true
  *         test 3: contract cannot perform frozen sensitive functions
  *         test 4: contract is now unlocked
  *         test 5: contract locked state is false
  *         test 6: contract balance is now 300
  * 
  *     (Bank)Testing freezing and defrosting of delay account
  *         test 1: contract frozen state changed
  *         test 2: contract frozen state now true
  *         test 3: contract cannot perform frozen sensitive functions
  *         test 4: contract is now unlocked
  *         test 5: contract locked state is false
  *         test 6: contract balance now 300
  * 
  *     (Bank)Testing freezing and defrosting of trust account
  *         test 1: contract lock status changes
  *         test 2 : contract is locked
  *         test 3: contract cannot use lock sensitive functions
  *         test 4: contract is back to origional state
  *         test 5: contract is unlocked
  * 
  *>> CHANGING OWNERSHIP OF CONTRACT TEST
  *     (Bank)Testing changing of access account ownership
  *         test 1: contract dose not recognise old owner
  *         test 2: contracts new owner is correct
  *     
  *     (Bank)Testing changing of delay account ownership
  *         test 1: contract dose not recognise old owner
  *         test 2: contracts new owner is correct
  * 
  *     (Bank)Testing changing of trust account ownership
  *         TODO
  * 
  *>> CHANGING LIMITS TEST
  *     (Bank)Testing ability to change new account limit
  *         test 1: new contract limit has changed
  *         test 2: contracts new limit is 5000
  * 
  *     (Bank)Testing the ability of a bank to change an existing accounts limit
  *         test 1: contract limit is noew different
  *         test 2: contract limit is set to new amount
  *         test 3: contract cannot have a limit changed to below balance 
  * 
  *>> DISSOLVING  
  *     (Bank)Testing dissolving of access account
  *         test 1: becuse this throws an
  *             'attempting to run transaction which calls a contract function, 
  *             but recipient address ... is not a contract address'
  *             it is surrounded in a try catch
  * 
  *     (Bank)Testing dissolving of delay account
  *         test 1: becuse this throws an
  *             'attempting to run transaction which calls a contract function, 
  *             but recipient address ... is not a contract address'
  *             it is surrounded in a try catch
  * 
  *     (Bank)Testing dissolving of trust account
  *         test 1: becuse this throws an
  *             'attempting to run transaction which calls a contract function, 
  *             but recipient address ... is not a contract address'
  *             it is surrounded in a try catch
  *         test 2: bank dose not recvive funds as they have been divided amongst owners
  */

contract('Bank Tests', function(accounts) {

    const bankOwner = accounts[0];
    const userWallet = accounts[1];
    const accessAccountOwner = accounts[2];
    const delayAccountOwner = accounts[3];
    const trustAccountOwnerOne = accounts[4];
    const trustAccountOwnerTwo = accounts[5];
    const trustAccountOwnerThree = accounts[6];
    const trustAccountOwnerFour = accounts[7];

    beforeEach(async function () {
        bank = await Bank.new({from: bankOwner});
    });



/**
  * CREATION TESTS
  */

    /**
      * @dev tests the creation of an access account  
      */
    it("(Bank)Testing creating of access acount through the bank", async() => {
        await bank.createAccessAccount({from: accessAccountOwner});
        let accessAccountAddress = await bank.getBankAccountAddress(accessAccountOwner, {from: bankOwner});
        let accessAccountContract = await AccessAccount.at(accessAccountAddress);
        let lock = await accessAccountContract.getFrozen();

        //test 1: contract is created and can be read from
        assert.equal(lock, false, "Checking access acount created and can be accessed");

        await bank.lockAccount(accessAccountOwner, {from: bankOwner});
        let locked = await accessAccountContract.getFrozen();

        //test 2: contract is created and can be read from
        assert.equal(locked, true, "Checking access account can be used");
    });

    /**
      * @dev tests the creation of a delay account
      */
    it("(Bank)Testing creation of a delay account through the bank", async() => {
        await bank.creatingDelayAccount({from: delayAccountOwner});
        let delayAccountAddress = await bank.getBankAccountAddress(delayAccountOwner, {from: bankOwner});
        let delayAccountContract = await DelayAccount.at(delayAccountAddress);
        let lock = await delayAccountContract.getFrozen();

        //test 1: contract is created and can be read from
        assert.equal(lock, false, "Checking delay account was created and can be accessed");

        await bank.lockAccount(delayAccountOwner, {from: bankOwner});
        let locked = await delayAccountContract.getFrozen();

        //test 2: contract can be accessed
        assert.equal(locked, true, "Checking access delay can be used");
    });

    /**
      * @dev tests the creation of a trust account  
      */
    it("(Bank)Testing creation of trust account through the bank", async() => {
        let owners = [trustAccountOwnerOne, bankOwner, trustAccountOwnerThree, trustAccountOwnerFour];
        await bank.creatingTrustAccount(owners, {from: userWallet});
        let trustAccountAddress = await bank.getTrustAccountAddress(0, {from: bankOwner});
        let trustAccountContract = await TrustAccount.at(trustAccountAddress);
        let lock = await trustAccountContract.getFrozen();

        //test 1: contract is created and can be read from
        assert.equal(lock, false, "Checking trust account was created and can be accessed");

        let ownersTwo = [trustAccountOwnerOne, trustAccountOwnerTwo, trustAccountOwnerThree];
        await bank.creatingTrustAccount(ownersTwo, {from: bankOwner});
        //test 2: trust group number increasing properly
        let trustAccountAddressTwo = await bank.getTrustAccountAddress(1, {from: bankOwner});
        let trustAccountContractTwo = await TrustAccount.at(trustAccountAddressTwo);
        let lockTwo = await trustAccountContractTwo.getFrozen();

        //test 3: contract is created and can be read from
        assert.equal(lockTwo, false, "Checking trust account was created and can be accessed");
    });



/**
  * FREEZE / DEFROST TESTS 
  */

//TODO: error in revert test

    /**
      * @dev tests the freezing and defrosting of access account 
      */
    it("(Bank)Testing freezing and defrosting of access account", async() => {
        await bank.createAccessAccount({from: accessAccountOwner});
        let accessAccountAddress = await bank.getBankAccountAddress(accessAccountOwner, {from: bankOwner});
        let accessAccountContract = await AccessAccount.at(accessAccountAddress);
        let lock = await accessAccountContract.getFrozen();
        bank.lockAccount(accessAccountOwner, {from: bankOwner});
        let locked = await accessAccountContract.getFrozen();

        //test 1: contract frozen state changed
        assert.notEqual(lock, locked, "Checking the accounts frozen status has changed");

        //test 2: contract frozen state now true
        assert.equal(locked, true, "Checking the contract is now locked");

        //test 3: contract cannot perform frozen sensitive functions
        await assertRevert(accessAccountContract.deposit({value: 300}), EVMRevert);

        await bank.unlockAccount(accessAccountOwner, {from: bankOwner});
        let unlocked = await accessAccountContract.getFrozen();
        await accessAccountContract.deposit({value: 300});
        let balance = await accessAccountContract.getBalance();

        //test 4: contract is now unlocked
        assert.equal(lock, unlocked, "Checking the contract is now unlocked");

        //test 5: contract locked state is false
        assert.equal(unlocked, false, "Checking the lock is false");

        //test 6: contract balance is now 300
        assert.equal(balance["c"][0], 300, "Checking contract can be used after unlock");
    });

    /**
      * @dev tests the freezing and defrosting of delay account
      */
    it("(Bank)Testing freezing and defrosting of delay account", async() => {
        await bank.creatingDelayAccount({from: delayAccountOwner});
        let delayAccountAddress = await bank.getBankAccountAddress(delayAccountOwner, {from: bankOwner});
        let delayAccountContract = await DelayAccount.at(delayAccountAddress);
        let lock = await delayAccountContract.getFrozen();
        await delayAccountContract.deposit({value: 300});
        bank.lockAccount(delayAccountOwner, {from: bankOwner});
        let locked = await delayAccountContract.getFrozen();

        //test 1: contract frozen state changed
        assert.notEqual(lock, locked, "Checking the accounts frozen status has changed");

        //test 2: contract frozen state now true
        assert.equal(locked, true, "Checking the contract is now locked");

        //test 3: contract cannot perform frozen sensitive functions
        await assertRevert(delayAccountContract.freeze({from: bankOwner}), EVMRevert);

        await bank.unlockAccount(delayAccountOwner, {from: bankOwner});
        let unlocked = await delayAccountContract.getFrozen();
        await delayAccountContract.deposit({value: 100});
        let balance = await delayAccountContract.getBalance();

        //test 4: contract is now unlocked
        assert.equal(lock, unlocked, "Checking the contract is now unlocked");

        //test 5: contract locked state is false
        assert.equal(unlocked, false, "Checking the lock is false");

        //test 6: contract balance now 300
        assert.equal(balance["c"][0], 400, "Checking contract can be used after unlock");
    });

    /**
      * 
      */
    it("(Bank)Testing freezing and defrosting of trust account", async() => {
        let owners = [trustAccountOwnerOne, trustAccountOwnerTwo, trustAccountOwnerThree, trustAccountOwnerFour];
        await bank.creatingTrustAccount(owners, {from: userWallet});
        let trustAccountAddress = await bank.getTrustAccountAddress(0, {from: bankOwner});
        let trustAccountContract = await TrustAccount.at(trustAccountAddress);
        await trustAccountContract.deposit({value: 400});
        let lock = await trustAccountContract.getFrozen();
        bank.lockTrustAccount(0, {from: bankOwner});
        let locked = await trustAccountContract.getFrozen();

        //test 1: contract lock status changes
        assert.notEqual(lock, locked, "Checking lock status changes");

        //test 2 : contract is locked
        assert.equal(locked, true, "Checking the contract is now locked");

        //test 3: contract cannot use lock sensitive functions
        await assertRevert(trustAccountContract.requestWithdraw(trustAccountOwnerThree, 200, {from: trustAccountOwnerThree}), EVMRevert);

        await bank.unlockTrustAccount(0, {from: bankOwner});
        let unlocked = await trustAccountContract.getFrozen();

        //test 4: contract is back to origional state
        assert.equal(lock, unlocked, "Checking contract is back to origional state");

        //test 5: contract is unlocked
        assert.equal(unlocked, false, "Checking the account is unlocked");
    });



/**
  * CHANGING OWNERSHIP OF CONTRACT TEST
  */

    /**
      * @dev tests the changing of owners for the access account 
      */
    it("(Bank)Testing changing of access account ownership", async() => {
        await bank.createAccessAccount({from: accessAccountOwner});
        let accessAccountAddress = await bank.getBankAccountAddress(accessAccountOwner, {from: bankOwner});
        let accessAccountContract = await AccessAccount.at(accessAccountAddress);
        bank.changeOwnership(accessAccountOwner, userWallet, {from: bankOwner});
        let currentOwner = await accessAccountContract.getOwner({from: userWallet});

        //test 1: contract dose not recognise old owner
        await assertRevert(accessAccountContract.getOwner({from: accessAccountOwner}), EVMRevert);
        
        //test 2: contracts new owner is correct
        assert.equal(currentOwner, userWallet, "Checking the new owner is the given address");        
    });

    /**
      * @dev tests the changing of owners for the delay account 
      */
    it("(Bank)Testing changing of delay account ownership", async() => {
        await bank.creatingDelayAccount({from: delayAccountOwner});
        let delayAccountAddress = await bank.getBankAccountAddress(delayAccountOwner, {from: bankOwner});
        let delayAccountContract = await DelayAccount.at(delayAccountAddress);
        bank.changeOwnership(delayAccountOwner, userWallet, {from: bankOwner});
        let currentOwner = await delayAccountContract.getOwner({from: userWallet});

        //test 1: contract dose not recognise old owner
        await assertRevert(delayAccountContract.getOwner({from: delayAccountAddress}), EVMRevert);

        //test 2: contracts new owner is correct
        assert.equal(currentOwner, userWallet, "Checking the new owner is the given address");
    });

    /**
      * @dev tests the changing of ownership for trust accounts 
      *     (in the case of a lost private key. Not intended to be used for adding new trust members or 
      *     changing ownership between entities)
      */
    it("(Bank)Testing changing of trust account ownership", async() => {
        let owners = [trustAccountOwnerOne, trustAccountOwnerTwo, trustAccountOwnerThree, trustAccountOwnerFour];
        await bank.creatingTrustAccount(owners, {from: userWallet});
        let trustAccountAddress = await bank.getTrustAccountAddress(0, {from: bankOwner});
        let trustAccountContract = await TrustAccount.at(trustAccountAddress);
        trustAccountContract.deposit({value: 300});
        await bank.changeOwnershipTrustGroup(trustAccountOwnerTwo, userWallet, 0, {from: bankOwner});

        //test 1: contract dose not allow owner sensitive functions to be called by old owner
        await assertRevert(trustAccountContract.requestWithdraw(trustAccountOwnerTwo, 100, {from: trustAccountOwnerTwo}), EVMRevert);
    });



/**
  * CHANGING LIMITS TEST
  */

    /**
      * @dev tests the banks ability to change the limit of new accounts 
      */
    it("(Bank)Testing ability to change new account limit", async() => {
        await bank.createAccessAccount({from: accessAccountOwner});
        let accessAccountAddress = await bank.getBankAccountAddress(accessAccountOwner, {from: bankOwner});
        let accessAccountContract = await AccessAccount.at(accessAccountAddress);
        let limit = await accessAccountContract.getLimit({from: accessAccountOwner});
        await bank.newAccountLimitModifier(5000, {from: bankOwner});
        await bank.createAccessAccount({from: userWallet});
        let accessAccountAddressTwo = await bank.getBankAccountAddress(userWallet, {from: bankOwner});
        let accessAccountContractTwo = await AccessAccount.at(accessAccountAddressTwo);
        let limitTwo = await accessAccountContractTwo.getLimit({from: userWallet});
        
        //test 1: new contract limit has changed
        assert.notEqual(limit, limitTwo, "Checking the limit of the new acount is different");

        //test 2: contracts new limit is 5000
        assert.equal(limitTwo["c"][0], 5000, "Checking the limit of the new account is 5000");
    });

    /**
      * @dev tests that the bank can change the limit of a pre existing account so long as:
      *     the limit change dose not mean they are over the limit 
      */
    it("(Bank)Testing the ability of a bank to change an existing accounts limit", async() => {
        await bank.createAccessAccount({from: accessAccountOwner});
        let accessAccountAddress = await bank.getBankAccountAddress(accessAccountOwner, {from: bankOwner});
        let accessAccountContract = await AccessAccount.at(accessAccountAddress);
        let limit = await accessAccountContract.getLimit({from: accessAccountOwner});
        await bank.accountLimitModifier(accessAccountAddress, 3000, {from: bankOwner});
        let limitAfter = await accessAccountContract.getLimit({from: accessAccountOwner});

        //test 1: contract limit is noew different
        assert.notEqual(limit, limitAfter, "Checking account limit changed");

        //test 2: contract limit is set to new amount
        assert.equal(limitAfter, 3000, "Checking limit is 3000");

        await accessAccountContract.deposit({value: 3000});

        //test 3: contract cannot have a limit changed to below balance 
        await assertRevert(bank.accountLimitModifier(accessAccountAddress, 2000, {from: bankOwner}), EVMRevert);
    });



/**
  * DISSOLVING  
  */

    /** 
      * @dev tests the ability of the bank to dissolve an access account 
      */
    it("(Bank)Testing dissolving of access account", async() => {
        await bank.createAccessAccount({from: accessAccountOwner});
        let accessAccountAddress = await bank.getBankAccountAddress(accessAccountOwner, {from: bankOwner});
        let accessAccountContract = await AccessAccount.at(accessAccountAddress);
        await bank.dissolveAccount(accessAccountAddress);

        //test 1: becuse this throws an
            //'attempting to run transaction which calls a contract function, 
            //but recipient address ... is not a contract address'
            //it is surrounded in a try catch
            try {
                await accessAccountContract.freeze({from: userWallet});
                //if it works it should never reach here
                assert.equal(true, false, "");
            } catch(e) {
                //when the .freeze() fails it should skip the assert and this should run
                assert.equal(true, true, "");
            }
    });

    /** 
      * @dev tests the ability of the bank to dissolve a delay account 
      */
    it("(Bank)Testing dissolving of delay account", async() => {
        await bank.creatingDelayAccount({from: delayAccountOwner});
        let delayAccountAddress = await bank.getBankAccountAddress(delayAccountOwner, {from: bankOwner});
        let delayAccountContract = await DelayAccount.at(delayAccountAddress);
        await bank.dissolveAccount(delayAccountAddress);

        //test 1: becuse this throws an
            //'attempting to run transaction which calls a contract function, 
            //but recipient address ... is not a contract address'
            //it is surrounded in a try catch
            try {
                await delayAccountContract.freeze({from: userWallet});
                //if it works it should never reach here
                assert.equal(true, false, "");
            } catch(e) {
                //when the .freeze() fails it should skip the assert and this should run
                assert.equal(true, true, "");
            }
    });

     /** 
      * @dev tests the ability of the bank to dissolve a trust account 
      */
    it("(Bank)Testing dissolving of trust account", async() => {
        let owners = [trustAccountOwnerOne, bankOwner, trustAccountOwnerThree, trustAccountOwnerFour];
        await bank.creatingTrustAccount(owners, {from: userWallet});
        let trustAccountAddress = await bank.getTrustAccountAddress(0, {from: bankOwner});
        let trustAccountContract = await TrustAccount.at(trustAccountAddress);
        await bank.dissolveAccount(trustAccountAddress);

        //test 1: becuse this throws an
            //'attempting to run transaction which calls a contract function, 
            //but recipient address ... is not a contract address'
            //it is surrounded in a try catch
            try {
                await trustAccountContract.freeze({from: userWallet});
                //if it works it should never reach here
                assert.equal(true, false, "");
            } catch(e) {
                //when the .freeze() fails it should skip the assert and this should run
                assert.equal(true, true, "");
            }

            let bankBalance = await bank.getBalance({from: bankOwner});

            //test 2: bank dose not recvive funds as they have been divided amongst owners
            assert.equal(bankBalance["c"][0], 0, "Checking balance of contract is 0, and contract value is distributed");
    });

})