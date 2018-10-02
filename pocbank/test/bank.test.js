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

    it("(Bank)Testing the creating of access acount through the bank", async() => {
        await bank.createAccessAccount({from: accessAccountOwner});
        let accessAccountAddress = await bank.getBankAccountAddress(accessAccountOwner, {from: bankOwner});
        let accessAccountContract = await AccessAccount.at(accessAccountAddress);
        let lock = await accessAccountContract.getFrozen();

        //test 1: contract is created and can be read from
        assert.equal(lock, false, "Checking access acount created and can be accessed");
    });

    it("(Bank)Testing the creation of a delay account through the bank", async() => {
        await bank.creatingDelayAccount({from: delayAccountOwner});
        let delayAccountAddress = await bank.getBankAccountAddress(delayAccountOwner, {from: bankOwner});
        let delayAccountContract = await DelayAccount.at(delayAccountAddress);
        let lock = await delayAccountContract.getFrozen();

        //test 1: contract is created and can be read from
        assert.equal(lock, false, "Checking delay account was created and can be accessed");
    });

    // it("(Bank)Testing the creation of trust account through the bank", async() => {
    //     let owners = [trustAccountOwnerOne, trustAccountOwnerTwo, trustAccountOwnerThree, trustAccountOwnerFour];
    //     await bank.creatingTrustAccount(owners, {from: userWallet});
    //     let trustAccountAddress = await bank.getTrustAccountAddress(1, {from: bankOwner});
    //     let trustAccountContract = await TrustAccount.at(trustAccountAddress);
    //     let lock = await trustAccountContract.getFrozen();

    //     //test 1: contract is created and can be read from
    //     assert.equal(lock, false, "Checking trust account was created and can be accessed");
    // });

    it("(Bank)Testing the freezing of access account", async() => {
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
        assertRevert(accessAccountContract.deposit({value: 300}), EVMRevert);
    });

    it("(Bank)Testing the changing of access account ownership", async() => {
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

    it("(Bank)Testing the changing of delay account ownership", async() => {
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

    // it("(Bank)Testing the changing of trust account ownership", async() => {
    //     let owners = [trustAccountOwnerOne, trustAccountOwnerTwo, trustAccountOwnerThree, trustAccountOwnerFour];
    //     await bank.creatingTrustAccount(owners, {from: userWallet});
    //     let trustAccountAddress = await bank.getTrustAccountAddress(1, {from: bankOwner});
    //     let trustAccountContract = await TrustAccount.at(trustAccountAddress);

    //     await bank.changeOwnershipTrustGroup(trustAccountOwnerTwo, userWallet, 1, {from: bankOwner});
    // });

})