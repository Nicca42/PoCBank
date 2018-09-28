pragma solidity ^0.4.24;

contract AccessAccount {
    address[2] private owners;
    uint balance;
        
    modifier onlyOwner(address isOwner){
        //TODO: must be an owners address
        require(owners[0] == isOwner || owners[1] == isOwner);
        _;
    }
        
    constructor(address[2] _owners) {
        owners = _owners;
    }
    
    function withdraw(uint _amount)
        public
        onlyOwner(msg.sender)
        //TODO: lockAccount
        returns(bool)
    {
        //TODO: lockAccount();
        //TODO: checks the amount is not more than this.balance
        //TODO: remove funds from account 
        //TODO: sends the corresponding number of eth
        //TODO: unlockAccount();
    }
    
    function deposit(uint _amount)
        public 
        onlyOwner(msg.sender)
        //TODO: lockAccount
    {
        //TODO: lockAccount();
        //TODO: increase balance
        //TODO: unlockAccount();
    }
    
}