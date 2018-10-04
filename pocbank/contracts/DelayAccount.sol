pragma solidity ^0.4.24;

import "./AccessAccount.sol";

contract DelayAccount is AccessAccount {
    //withdraw requests with the time, amount, who its to and if its been withdrawn
    struct WithdrawRequests {
        uint timeRequested;
        uint amountRequested;
        address to;
        bool withdrawn;
    }
    //the number of requests
    uint numberOfRequests = 1;
    //only added to if request is possible
    mapping(uint => WithdrawRequests) requests;

    event LogCreatedDelayAccount(address _owner, address _bank, AccessAccount.AccountType _chosenAccount);

    /**
      * @dev allows for the creation of a delay account. 
      */
    constructor(address _owner, uint _limit)
        AccessAccount(_owner, AccessAccount.AccountType.delay, _limit)
        public
    {
        AccessAccount.onwerAddress = _owner;
        bankAddress = msg.sender;
        AccessAccount.accountLimit = _limit;
        emit LogCreatedDelayAccount(_owner, msg.sender, AccessAccount.AccountType.delay);
    }

    /**
      * @param _amount : the amount they want to withdraw.
      * @dev the amount is detracted from the blance here to prevent 
      *     the user from making multiple requests that are for more than they
      *     have. 
      */
    function requestWithdraw(uint _amount, address _to)
        public
        isOwner()
        isFrozen()
        returns(uint)
    {
        AccessAccount.freeze();

        require(balance >= _amount, "Cannot withdraw more than balance");
        uint currentRequsetNo = numberOfRequests++;
        requests[currentRequsetNo] = WithdrawRequests({
            timeRequested: now,
            amountRequested: _amount,
            to: _to,
            withdrawn: false
        });
        numberOfRequests = currentRequsetNo;
        balance -= _amount;
        
        AccessAccount.defrost();
        return currentRequsetNo;
    }
    
    /**
      * @param _requestNo : The request number of the transaction
      * @dev only allows the owner(s) to withdraw. Dose not allow use if account is frozen 
      *     (or dissolved). Ensures the usage of witdraw in the child contracts for both delay
      *     contracts and trust contracts. 
      *     checks that the time has passed, that the withdraw has not already happened,
      *     function signature used to be function withdraw(address _to, uint _requestNo)
      *     but due to a truffle error where the complier dose not pick up Overloaded functions
      *     i had to change the contract to be overridden 
      */
    function withdraw(uint _requestNo)
        public
        isOwner()
        isFrozen()
    {
        AccessAccount.freeze();

        require(_requestNo <= numberOfRequests, "No such request exists");
        uint _timeRequested = requests[_requestNo].timeRequested;
        //30 (days) x 24 (hours in a day) x 60 (minutes in a hour) x 60 (seconds in a minute) = 2 592 000
        require(_timeRequested + 2592000 < now, "30 days have not passed");
        require(requests[_requestNo].withdrawn == false, "Amount already been withdrawn");
        requests[_requestNo].withdrawn = true;
        address _to = requests[_requestNo].to;
        _to.transfer(requests[_requestNo].amountRequested);

        AccessAccount.defrost();
    }
}