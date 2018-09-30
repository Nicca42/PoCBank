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

// var Bank = artifacts.require("./Bank.sol");
// var AccessAccount = artifacts.require("./AccessAccount.sol");
var DelayAccount = artifacts.require("./DelayAccount.sol");

contract('Delay Account Tests', function(accounts) {

    const bankOwner = accounts[0];
    const userWallet = accounts[1];
    const accessAccountOwner = accounts[2];
    const delayAccountOwner = accounts[3];
    const trustAccountOwner = accounts[4];

    // it("(Delay)Testing the creation of an account via the contract", async() => {
    //     let delayAccount = await DelayAccount.new(delayAccountOwner, 4000, {from: bankOwner});
    //     let delayAccountAddress = delayAccount.address;
    //     let delayAccountContact = await DelayAccount.at(delayAccountAddress);

    //     let balance = await delayAccountContact.getBalance({from: delayAccountOwner});
    //     let locked = await delayAccountContact.getFrozen();

    //     //test 1: 
    //     assert.equal(balance, 0, "Chekcing access account functions, getbalance()");
    //     assert.equal(locked, false, "CHecking access account functions, getFrozen()");
    // });



})