pragma solidity ^0.4.24;

import "./AccessAccount.sol";

contract TrustAccount is AccessAccount {
    address[] owners;

    event LogCreatedTrustAccount(address[] owners, address _bank, uint _limit);

    constructor(address _owner, address[] _owners, uint _limit)
        AccessAccount(_owner, AccessAccount.AccountType.trust, _limit)
        public
    {
        AccessAccount.onwerAddress = _owner;
        bankAddress = msg.sender;
        AccessAccount.accountLimit = _limit;
        owners = _owners;
        emit LogCreatedTrustAccount(_owners, msg.sender, _limit);
    }

    /**
      * @param _newOwnerAddress : the address of the new owner.
      * @dev allows the user to change the wallet assosiated with the account. 
      *     The require ensures that this function cannot be called on the trust account
      *     from the parent function (this function).
      */
    function changeOwner(address _newOwnerAddress)
        public
        isOwner()
        isFrozen()
    {
        freeze();

        require(thisAccountType != AccountType.trust, "Please use changeOwner function in trust contract");
        onwerAddress = _newOwnerAddress;

        unfreeze();
    }

    /**
      * @param _amount : the amount to be withdrawn 
      * @dev only allows the owner(s) to withdraw. Dose not allow use if account is frozen 
      *     (or dissolved). Ensures the usage of witdraw in the child contracts for both delay
      *     contracts and trust contracts. 
      */
    function withdraw(uint _amount)
        public
        isOwner()
        isFrozen()
    {
        freeze();

        require(thisAccountType != AccountType.trust, "Please use withdraw function in trust contract");
        require(thisAccountType != AccountType.delay, "Please use withdraw function in delay contract");
        require(_amount < balance, "Cannot withdraw more funds than available");
        balance -= _amount;
        onwerAddress.transfer(_amount);

        unfreeze();
    }
}