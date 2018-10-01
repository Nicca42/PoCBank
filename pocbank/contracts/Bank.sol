pragma solidity ^0.4.24;

import "./AccessAccount.sol";
import "./DelayAccount.sol";
import "./TrustAccount.sol";

contract Bank {
    address owner;
    struct AccountDetails {
        address owner;
        address bankAccount;
        AccessAccount.AccountType typeOfAccount;
    }
    //user wallets to their account details 
    mapping(address => AccountDetails) userWallets;

    /**
        @param userWallet : the address of the new users wallet.
        @dev Checks the account is not curently busy with a transaction. 
            This lock is seporate from locks placed on voting (trust accounts). 
    */
    modifier isLocked(address userWallet) {
        address usersAccountAddress = userWallets[userWallet].bankAccount;
        AccessAccount usersAccount = AccessAccount(usersAccountAddress);
        require(usersAccount.getFrozen() == false);
        _;
    }

    /** 
      * @dev checks the address is the bank owner.
      */
    modifier isOwner(){
        require(msg.sender == owner, "Function only accesibly by owner");
        _;
    }

    constructor()
        public
    {
        owner = msg.sender;
    }

    /**
     * @param _userWallet : the address of the users account 
     * @return address : the address of the users bank account
     * @dev : needs tinkering 
     */
    function getBankAccountAddress(address _userWallet)
        public
        view
        isOwner()
        returns(address)
    {
        return userWallets[_userWallet].bankAccount;
    }

    /**
        @param _toLock : The address of the user to lock.
        @dev Allows the bank to lock a user durning a transaction. 
    */
    function lockAddress(address _toLock)
        public
        isOwner()
    {
        address usersAccountAddress = userWallets[_toLock].bankAccount;
        AccessAccount usersAccount = AccessAccount(usersAccountAddress);
        usersAccount.freeze();
    }

    function unlockAddress(address _toUnlock)
        public
        isOwner()
    {
        address usersAccountAddress = userWallets[_toUnlock].bankAccount;
        AccessAccount usersAccount = AccessAccount(usersAccountAddress);
        usersAccount.defrost();
    }

//was going to do it like this, but as the various contracts require different 
//arguments it prooved more cumbersome than just creating seporate functions
    // function createAccount(AccessAccount.AccountType _chosenAccountType)
    //     public
    //     payable 
    //     // isLocked(msg.sender)
    //     returns(address)
    // {
    //     uint balance = msg.value;
    //     if(_chosenAccountType == AccessAccount.AccountType.access){
    //         return creatingAccessAccount(msg.sender);
    //     } else if(_chosenAccountType == AccessAccount.AccountType.delay) {
    //         return creatingDelayAccount(msg.sender);
    //     } else if(_chosenAccountType == AccessAccount.AccountType.trust) {
    //         return creatingTrustAccount(msg.sender);
    //     } else {
    //         return 0x0;
    //     }
    // }

    function createAccessAccount(address _owner)
        public
        payable
        returns(address)
    {   
        //TODO: create access account
    }

    function creatingDelayAccount(address _owner)
        public
        payable
        returns(address)
    {
        //TODO: create delay account
    }

    function creatingTrustAccount(address[] _owners)
        public
        payable
        returns(address)
    {
        //TODO: create trust account
    }
}