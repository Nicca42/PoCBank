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
        await bank.createAccessAccount(4000, {from: accessAccountOwner});
        let accessAccountAddress = await bank.getBankAccountAddress(accessAccountOwner, {from: bankOwner});
        let accessAccountContract = await AccessAccount.at(accessAccountAddress);
        let lock = await accessAccountContract.getFrozen();

        //test 1: contract is created and can be read from
        assert.equal(lock, false, "Checking access acount created and can be accessed");
    });

    it("(Bank)Testing the creation of a delay account through the bank", async() => {
        await bank.creatingDelayAccount(4000, {from: delayAccountOwner});
        let delayAccountAddress = await bank.getBankAccountAddress(delayAccountOwner, {from: bankOwner});
        let delayAccountContract = await DelayAccount.at(delayAccountAddress);
        let lock = await delayAccountContract.getFrozen();

        //test 1: contract is created and can be read from
        assert.equal(lock, false, "Checking delay account was created and can be accessed");
    });

    it("(Bank)Testing the creation of trust account through the bank", async() => {
        let owners = [trustAccountOwnerOne, trustAccountOwnerTwo, trustAccountOwnerThree, trustAccountOwnerFour];
        let groupNo = await bank.creatingTrustAccount(owners, 4000, {from: userWallet});
        let trustAccountAddress = await bank.getTrustAccountAddress(1, {from: bankOwner});
        let trustAccountContract = await TrustAccount.at(trustAccountAddress);
        let lock = await trustAccountContract.getFrozen();

        //test 1: contract is created and can be read from
        assert.equal(lock, false, "Checking trust account was created and can be accessed");
    });

})