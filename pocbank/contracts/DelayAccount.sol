pragma solidity ^0.4.24;

import "./AccessAccount.sol";

contract DelayAccount is AccessAccount {
    struct WithdrawRequests {
        uint timeRequested;
        uint amountRequested;
        bool withdrawn;
    }
    uint numberOfRequests = 0;
    //only added to if request is possible
    mapping(uint => WithdrawRequests) requests;

    event LogCreatedDelayAccount(address _owner, address _bank);

    constructor(address _owner, uint _limit)
        AccessAccount(_owner, AccessAccount.AccountType.delay, _limit)
        public
    {
        AccessAccount.onwerAddress = _owner;
        bankAddress = msg.sender;
        AccessAccount.accountLimit = _limit;
        emit LogCreatedDelayAccount(_owner, msg.sender);
    }

    /**
      * @param _amount : the amount they want to withdraw.
      * @dev the amount is detracted from the blance here to prevent 
      *     the user from making multiple requests that are for more than they
      *     have. 
      */
    function requestWithdraw(uint _amount)
        public
        isOwner()
        returns(uint requestNo)
    {
        AccessAccount.freeze();

        require(balance >= _amount, "Cannot withdraw more than balance");
        uint currentRequsetNo = numberOfRequests++;
        requests[currentRequsetNo] = WithdrawRequests({
            timeRequested: now,
            amountRequested: _amount,
            withdrawn: false
        });
        balance -= _amount;

        AccessAccount.defrost();
        return currentRequsetNo;
    }
    
    /**
      * @param _to : who (address) the funds must go to
      * @dev only allows the owner(s) to withdraw. Dose not allow use if account is frozen 
      *     (or dissolved). Ensures the usage of witdraw in the child contracts for both delay
      *     contracts and trust contracts. 
      *     checks that the time has passed, that the withdraw has not already happened,
      */
    function withdraw(address _to, uint _requestNo)
        public
        isOwner()
        isFrozen()
    {
        AccessAccount.freeze();

        require(_requestNo <= numberOfRequests, "No such request exists");
        uint timeRequested = requests[_requestNo].timeRequested;
        //30 (days) x 24 (hours in a day) x 60 (minutes in a hour) x 60 (seconds in a minute) = 2 592 000
        require(timeRequested + 2592000 < now, "30 days have not passed");
        require(requests[_requestNo].withdrawn == false, "Amount already been withdrawn");
        requests[_requestNo].withdrawn = true;
        _to.transfer(requests[_requestNo].amountRequested);

        AccessAccount.defrost();
    }
}