pragma solidity ^0.4.24;

import "./Bank.sol";

contract AccessAccount {
    address owner;
    address bank;
    bool frozen = false;
    uint balance;

    event LogCreatedAccessAccountContract(address _this, address _owner);
    
    event LogEvent(string _description, uint _choice, address _thisAddress);
        
    modifier onlyOwner(address isOwner){
        require(isOwner == owner || isOwner == bank, "Must be owner");
        _;
    }
    
    modifier frozonCheck() {
        require(frozen == false, "Account is frozon. Please unfreeze");
        Bank bankOb = Bank(bank);
        require(bankOb.isAccountFrozen() == false, "Account is frozon. Please unfreeze");
        _;
    }
        
    /**
      * @param _bank : The address of the bank that created the account
      * @param _owner : The owner of the account
      * @dev Logs creation, sets the owner and the bank.
      */
    constructor(address _bank, address _owner) {
        owner = _owner;
        bank = _bank;
        emit LogCreatedAccessAccountContract(this, _owner);
    }
    
    function isLocked() 
        public
        view
        returns(bool)
    {
        return frozen;
    }
    
    function freezeAccount()
        public
        onlyOwner(msg.sender)
        returns(bool)
    {
        if(frozen == true){
            return false;
        }
        frozen = true;
        return true;
    }
    
    function unfreezeAccount()
        public
        onlyOwner(msg.sender)
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
        onlyOwner(msg.sender)
        frozonCheck()
        returns(uint)
    {
        require(freezeAccount(), "Account must freeze successfully during transactions");

        require(_amount < balance, "Cannot withdraw more than balance");
        require(balance - _amount > 0, "Cannot make balance negative");

        balance -= _amount;
        owner.transfer(_amount);
        
        require(unfreezeAccount(), "Account must freeze successfully during transactions");

        return balance;
    }
    
    function sendFunds(address _to)
        public
        payable
        onlyOwner(msg.sender)
        frozonCheck()
        returns(uint)
    {
        require(freezeAccount(), "Account must freeze successfully during transactions");



        require(unfreezeAccount(), "Account must freeze successfully during transactions");
        return balance;
    }
    
    function deposit(uint _amount)
        public 
        payable
        frozonCheck()
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
        return balance;
    }
    
}