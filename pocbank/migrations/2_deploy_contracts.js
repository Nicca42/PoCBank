var BankContract = artifacts.require("./Bank.sol");
module.exports = function(deployer) {
  deployer.deploy(BankContract);
};