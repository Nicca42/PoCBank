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
    const trustAccountOwner = accounts[4];

    it("(Access)Testing the creation of an account via the contract", async() => {
        let allOwners = [0x0, 0x0, 0x0];
        let trustAccount = await TrustAccount.new(trustAccountOwner, allOwners, 4000, {from: userWallet});
        let trustAccountAddress = trustAccount.address;
        let trustAccountContact = await TrustAccount.at(trustAccountAddress);
        let balance = await trustAccountContact.getBalance({from: trustAccountOwner});
        let locked = await trustAccountContact.getFrozen();

        //test 1: contract can access balance
        assert.equal(balance, 0, "Chekcing access account functions, getbalance()");

        //test 2: contract can access frozen status
        assert.equal(locked, false, "CHecking access account functions, getFrozen()");
    });


})