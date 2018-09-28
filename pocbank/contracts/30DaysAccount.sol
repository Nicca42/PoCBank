pragma solidity ^0.4.24;

//TODO: imports

contract DelayAccount {
    address[2] owners;
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
    modifier isOwner(address owner){
        require(owners[0] == owner || owners[1] == owner);
        _;
    }
    
    /**
     @param _owners : the addresses of the 2 owners of this contract
    */
    constructor(address[2] _owners) {
        owners = _owners;
    }
    
    function requestWithdraw(uint _amount) 
        public
        isOwner(msg.sender)
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
        isOwner(msg.sender)
        return(uint)
    {
        //TODO: check if the withdraw history if anywithdraw is not compelaed,
        //TODO: has passed the time and is now true (check time here)
        //TODO: check the withraw request passed (possible)
        //TODO: call check withdraw possible
    }
    
    function isWithdrawPossible()
        public 
        isOwner(msg.sender)
        return(bool)
    {
        //TODO: check if the address can withdraw this amount 
        return true;
    }
    
    function deposit(uint _amount)
        public
        payable 
    {
        //TODO: lock both parties in system.
        //TODO: take eth given, check it against the _amount
        //TODO: change balance 
    }
}