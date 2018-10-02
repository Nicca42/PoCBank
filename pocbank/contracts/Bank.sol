pragma solidity ^0.4.24;

import "./AccessAccount.sol";
import "./DelayAccount.sol";
import "./TrustAccount.sol";

contract Bank {
    address owner;
    //the counter for trust groups
    uint trustGroupNumbers = 0;
    //the limit for all accounts
    uint limit = 40000;
    //the data stored for access and delay accounts
    struct AccountDetails {
        address owner;
        address bankAccount;
        AccessAccount.AccountType typeOfAccount;
    }
    //the data stored for trust accounts
    struct TrustGroupDetails {
        address[] owners;
        address bankAccount;
    }
    //user wallets to their account details 
    mapping(address => AccountDetails) userWallets;
    //trust group numbers to their information
    mapping(uint => TrustGroupDetails) trustGroups; 

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

    function getTrustGroupDetails(uint _groupNumber)
        public
        view
        isOwner()
        returns(address[])
    {
        return trustGroups[_groupNumber].owners;
    }

    function getTrustAccountAddress(uint _groupNumber)
        public
        view
        isOwner()
        returns(address)
    {
        return trustGroups[_groupNumber].bankAccount;
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

    /**
      * @dev the user can only have one account on the system at a time, but in a future version 
      *     the userWallet[] could be linked to an array of accounts instead of a single account. 
      *     E.G: mapping(address => AccountDetails[]) userWallets;
      */
    function createAccessAccount()
        public
        returns(address)
    {   
        address newAccountAddress = new AccessAccount(msg.sender, AccessAccount.AccountType.access, limit);
        
        userWallets[msg.sender] = AccountDetails({
            owner: msg.sender,
            bankAccount: newAccountAddress,
            typeOfAccount: AccessAccount.AccountType.access
        });

        return newAccountAddress;
    }

    /**
      * @dev if a user already has an account then the new account will override their 
      *     current account and it will be lost. This is for a proof of consept and
      *     not an alpha, and therfore this functionality was left out. 
      */
    function creatingDelayAccount()
        public
        returns(address)
    {
        address newDelayAccountAddress = new DelayAccount(msg.sender, limit);
        userWallets[msg.sender] = AccountDetails({
            owner: msg.sender,
            bankAccount: newDelayAccountAddress,
            typeOfAccount: AccessAccount.AccountType.delay
        });

        return newDelayAccountAddress;
    }

    /**
      * @param _owners : the owners of the trust account
      * @dev 
      */
    function creatingTrustAccount(address[] _owners)
        public
        returns(address)
    {
        address newTrustAccountAddress = new TrustAccount(_owners, limit);
        trustGroups[trustGroupNumbers++] = TrustGroupDetails({
            owners: _owners,
            bankAccount: newTrustAccountAddress
        });
        trustGroupNumbers++;
        return newTrustAccountAddress;
    }

    function lockAccount(address _owner)
        public
        isOwner()
    {
        address accountAddress = userWallets[_owner].bankAccount;
        AccessAccount account = AccessAccount(accountAddress);
        account.freeze();
    }

    function unlockAccount(address _owner)
        public
        isOwner()
    {
        address accountAddress = userWallets[_owner].bankAccount;
        AccessAccount account = AccessAccount(accountAddress);
        account.defrost();
    }

    function lockTrustAccount(uint _trustGroupNumber)
        public
        isOwner()
    {
        address accountAddress = trustGroups[_trustGroupNumber].bankAccount;
        TrustAccount account = TrustAccount(accountAddress);
        account.freeze();
    }

    function unlockTrustAccount(uint _trustGroupNumber)
        public
        isOwner()
    {
        address accountAddress = trustGroups[_trustGroupNumber].bankAccount;
        TrustAccount account = TrustAccount(accountAddress);
        account.defrost();
    }

    /**
      * @param _oldAddress : the old user wallet address
      * @param _newAddress : the address of the new user wallet
      * @dev changes the ownership of access and delay accounts 
      */
    function changeOwnership(address _oldAddress, address _newAddress)
        public
        isOwner()
    {
        require(userWallets[_oldAddress].owner == _oldAddress);

        address accountAddress = userWallets[_oldAddress].bankAccount;
        AccessAccount accountContract = AccessAccount(accountAddress);
        accountContract.changeOwner(_newAddress);
        userWallets[_newAddress].owner = _newAddress;
        userWallets[_newAddress].bankAccount = accountAddress;
        userWallets[_newAddress].typeOfAccount = userWallets[_oldAddress].typeOfAccount;
        userWallets[_oldAddress].owner = 0x0;
        userWallets[_oldAddress].bankAccount = 0x0;
        userWallets[_oldAddress].typeOfAccount;
    }

    /**
    struct AccountDetails {
        address owner;
        address bankAccount;
        AccessAccount.AccountType typeOfAccount;
    }
    //the data stored for trust accounts
    struct TrustGroupDetails {
        address[] owners;
        address bankAccount;
    }
     */

    /**
      * @param _oldAddress : the old user wallet address
      * @param _newAddress : the new user wallet address
      * @param _groupNumber : the trust grup number 
      * @dev 
      */
    function changeOwnershipTrustGroup(address _oldAddress, address _newAddress, uint _groupNumber)
        public
        isOwner()
    {
        address accountAddress = trustGroups[_groupNumber].bankAccount;
        TrustAccount accountContract = TrustAccount(accountAddress);
        address[] memory newOwners = accountContract.changeOwner(_oldAddress, _newAddress);
        trustGroups[_groupNumber].owners = newOwners;
    }

    //TODO: make limit modifier 

    //TODO: make disovle accounts 
}