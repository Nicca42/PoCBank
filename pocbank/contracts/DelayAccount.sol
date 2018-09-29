pragma solidity ^0.4.24;

//TODO: imports

contract DelayAccount {
    address owner;
    address bank;
    uint balance;
    bool lock = false;
    
    struct WithdrawRequest {
        uint time;
        bool possible;
        uint amount;
        bool compleatedDelay;
    }
    
    WithdrawRequest[] allWithdrawRequests;
    
    //TODO: modifier isOwner
    modifier onlyOwner(address isOwner){
        require(isOwner == owner || isOwner == bank, "Must be owner");
        _;
    }
    
    /**
     @param _owner : the addresses of the 2 owners of this contract
    */
    constructor(address _owner, address _bank) {
        owner = _owner;
        bank = _bank;
    }
    
    function requestWithdraw(uint _amount) 
        public
        onlyOwner(msg.sender)
        returns(uint)
    {
        //TODO: balance =- _amount;
        //TODO: add withdraw request to allWithdrawRequests[]
        //TODO: return: the time it will be till the withdraw can be made, 
        //TODO: if its 1 it failed
    }
    
    
    function withdraw(uint _amount)
        public
        payable 
        onlyOwner(msg.sender)
        returns(uint)
    {
        //TODO: check if the withdraw history if anywithdraw is not compelaed,
        //TODO: has passed the time and is now true (check time here)
        //TODO: check the withraw request passed (possible)
        //TODO: call check withdraw possible
    }
    
    function isWithdrawPossible()
        public 
        onlyOwner(msg.sender)
        returns(bool)
    {
        //TODO: check if the address can withdraw this amount 
        return true;
    }

    function deposit(uint _amount)
        public 
        payable
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