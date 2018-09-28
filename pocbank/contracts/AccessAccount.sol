pragma solidity ^0.4.24;

import"./Bank.sol";

contract AccessAccount {
    address owner;
    address bank;
    bool frozen = false;
    uint balance;
    
    event LogEvent(string _description, uint _choice, address _thisAddress);
        
    modifier onlyOwner(address isOwner){
        require(isOwner == owner || isOwner == bank);
        _;
    }
    
    modifier frozonCheck() {
        require(frozen == false);
        Bank bankOb = Bank(bank);
        require(bankOb.isAccountFrozen() == false);
        _;
    }
        
    constructor(address _bank, address _owner) {
        LogEvent("Created the contract", 1, this);
        owner = _owner;
        bank = _bank;
    }
    
    function isLocked() 
        public
        view
        returns(bool)
    {
        return frozen;
    }
    
    function freezeAccount()
        internal
        returns(bool)
    {
        if(frozen == true){
            return false;
        }
        frozen = true;
        return true;
    }
    
    function unfreezeAccount()
        internal
        returns(bool)
    {
        if(frozen == false){
            return false;
        }
        frozen = false;
        return true;
    }
    
    function withdraw(uint _amount)
        public
        payable
        // onlyOwner(msg.sender)
        frozonCheck()
        returns(bool)
    {
        require(freezeAccount());
        //TODO: checks the amount is not more than this.balance
        //TODO: remove funds from account 
        //TODO: sends the corresponding number of eth
        
        require(_amount < balance, "Cannot withdraw more than balance");
        require(balance - _amount > 0);
        balance = balance - _amount;
        owner.send(_amount);
        
        require(unfreezeAccount());
    }
    
    function sendFunds(address _to)
        public
        payable
        frozonCheck()
        returns(bool)
    {
        
    }
    
    function deposit(uint _amount)
        public 
        payable
        onlyOwner(msg.sender)
        //TODO: lockAccount
    {
        balance += msg.value;
        //TODO: lockAccount();
        //TODO: unlockAccount();
    }
    
    function viewBalance()
        public
        view
        onlyOwner(msg.sender)
        returns(uint)
    {
        return this.balance;
    }
    
}