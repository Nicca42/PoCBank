pragma solidity ^0.4.24;

contract AccessAccount{
    address bankAddress;
    address onwerAddress;
    uint balance;
    uint accountLimit;
    bool frozen;
    enum AccountType {access, delay, trust}
    AccountType thisAccountType;

    event LogCreatedAccessAcount(address _owner, address _bank, AccountType _accountType);
    event LogUnexpectedRevert(string _where);

    /**
      * @dev checks that the msg.sender is an owner of the contract
      */
    modifier isOwner() {
        require(msg.sender == bankAddress || msg.sender == onwerAddress, "Function only accessible by owner");
        _;
    }

    /**
      * @dev checks that the bank is the only address able of using the function
      */
    modifier isBank() {
        require(msg.sender == bankAddress, "Function only usable by bank");
        _;
    }

    /** 
      * @dev checks the account is not frozen, and that the account is not dissolved 
      */
    modifier isFrozen() {
        require(frozen == false, "Account is frozen");
        _;
    }

    /**
      * @param _owner : the address of the user creating the account
      * @param _chosenType : the type of account this instance is (as this is the parent contract)
      * @dev creates a new access acount, logs creation
      */
    constructor(address _owner, AccountType _chosenType, uint _limit)
        public
    {
        onwerAddress = _owner;
        bankAddress = msg.sender;
        thisAccountType = _chosenType;
        accountLimit = _limit;
        frozen = false;
        emit LogCreatedAccessAcount(_owner, msg.sender, _chosenType);
    }

    /**
      * @dev returns if the account is frozen (true) or (false) if not
      */
    function getFrozen() 
        public
        view
        returns(bool)
    {
        return frozen;
    }

    /**
      * @dev allows for anyone to check the balance of an account
      */
    function getBalance()
        public
        view
        returns(uint)
    {
        return balance;
    }

    function getOwner()
        public
        view
        isOwner()
        returns(address)
    {
        return onwerAddress;
    }

    function getLimit()
        public
        view
        isOwner()
        returns(uint)
    {
        return accountLimit;
    }

    function setLimit(uint _newLimit)
        public
        isBank()
    {
        accountLimit = _newLimit;
    }

    /**
      * @dev freezed the account. The isFrozen() is used to ensure an already
      *     frozen account cannot be frozen again.
      */
    function freeze()
        public
        isOwner()
        isFrozen()
    {
        frozen = true;
    }

    /**
      * @dev unfreezes account. Manually checks the account is not dissolved. 
      */
    function defrost()
        public 
        isOwner()
    {
        require(frozen == true, "Account already unfrozen");
        frozen = false;
    }

    event LogProgress(string _desc);

    /**
      * @dev lets the bank dissolve account, sending all funds to the owner
      */
    function dissolve()
        public
        isBank()
    {
        frozen =  true;
        emit LogProgress("(access) disolve");
        selfdestruct(onwerAddress);
    }

    /**
      * @param _newOwnerAddress : the address of the new owner.
      * @dev allows the user to change the wallet assosiated with the account. 
      *     The require ensures that this function cannot be called on the trust account
      *     from the parent function (this function).
      */
    function changeOwner(address _newOwnerAddress)
        public
        isBank()
        isFrozen()
    {
        freeze();

        require(thisAccountType != AccountType.trust, "Please use changeOwner function in trust contract");
        onwerAddress = _newOwnerAddress;

        defrost();
    }

    /**
      * @dev allows anyone to deposit into the account, as depositing can be 
      *     done by any wallet. Requires the amount to be greater than 0 and also
      *     ensures that the balance will not overflow from deposit. 
      */
    function deposit()
        public
        payable
        isFrozen()
    {
        require(balance + msg.value > 0, "Value cannot make balance negative");
        require(balance + msg.value <= accountLimit, "Deposit takes account over limit");
        balance += msg.value;
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

        emit LogUnexpectedRevert("(in withdraw) after freezing account");

        require(thisAccountType == AccountType.access, "Please use withdraw function in child contract");

        emit LogUnexpectedRevert("(after 1 require) after trust/delay require");

        require(_amount <= balance, "Cannot withdraw more funds than available");

        emit LogUnexpectedRevert("(after 2 require) after amount gets checked against balance");

        balance -= _amount;
        onwerAddress.transfer(_amount);

        emit LogUnexpectedRevert("() after transfering amount");
        defrost();
    }
}