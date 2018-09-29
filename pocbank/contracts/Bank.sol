pragma solidity ^0.4.24;

import "./AccessAccount.sol";
import "./DelayAccount.sol";
import "./TrustAccount.sol";

contract Bank {
    
    address owner;
    enum AccountType {access, delay, trust}
    //only for access and delay accounts
    struct AccountDetails {
        address owner;
        address bankAccount;
        AccountType typeOfAccount;
    }
    
    mapping (address => AccountDetails) private userWallets;
    mapping(address => bool) userWalletLocks;
    
    event AccessAccountCreated(address _owner, AccountType _accountType, uint _initialBalance);
    event DelayAccountCreated(address _owner, AccountType _accountType, uint _initialBalance);
    event TrustAccountCreated(address _initailOwner, AccountType _accountType, uint _initialBalance);
    event LogEvent(string _pointInCode, address _addressOFContract);
    
    /**
        @param userWallet : the address of the new users wallet.
        @dev Checks the account is not curently busy with a transaction. 
            This lock is seporate from locks placed on voting (trust accounts). 
    */
    modifier isLocked(address userWallet) {
        require(userWalletLocks[userWallet] != true);
        if(userWallets[userWallet].bankAccount != 0x0){
            if(userWallets[userWallet].typeOfAccount == AccountType.access){
                //access account 
                 AccessAccount isLockedAccount = AccessAccount(userWallets[userWallet].bankAccount);
                 require(isLockedAccount.isLocked() != true);
            } else if(userWallets[userWallet].typeOfAccount == AccountType.delay){
                //delay, 30 days, account
                
            } else if(userWallets[userWallet].typeOfAccount == AccountType.trust){
                //trust account
                
            } else {
                //user accoutn not identified
            }
        }
        _;
    }

    modifier isOwner(address _toCheck){
        require(_toCheck == owner, "Function only accesibly by owner");
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
        returns(address)
    {
        require(msg.sender == owner);
        return userWallets[_userWallet].bankAccount;
    }
    
    /**
        @param _toLock : The address of the user to lock.
        @dev Allows the bank to lock a user durning a transaction. 
    */
    function lockAddress(address _toLock)
        public
        isOwner(msg.sender)
        returns(bool)
    {
        require(userWalletLocks[_toLock] == false, "User wallet already locked");
        userWalletLocks[_toLock] = true;
        return true;
    }
    
    function unlockUser(address _toUnlock)
        public
        isOwner(msg.sender)
        returns(bool)
    {
        require(userWalletLocks[_toUnlock] == true, "User wallet aready unlocked");
        userWalletLocks[_toUnlock] == false;
        //TODO: unlock the linked bank account if it exisits
        return true;
    }
    
    /**
        @param _chosenType : The type of account. 
                1 : access account
                2 : delay, or the 30 days withdrawls account
                3 : the shared access trust account
        @dev This function makes the contracts for the users, with 
            different data reqirements. 
    */
    function createBankAccount(uint8 _chosenType) 
        public
        payable
        // isLocked(msg.sender)
        returns(address)    
    {
        uint balance = msg.value;
        if(_chosenType == 1){
            // access account
            address newAccountAddress = new AccessAccount(this, msg.sender);
            AccessAccount accessAccount = AccessAccount(newAccountAddress);
            accessAccount.deposit.value(msg.value)(balance);
            userWallets[msg.sender] = AccountDetails({
                owner: msg.sender,
                bankAccount: newAccountAddress,
                typeOfAccount: AccountType.access
            });
            emit AccessAccountCreated(msg.sender, AccountType.access, balance);
            return newAccountAddress;
            
        } else if(_chosenType == 2){
            //delay, 30 days, account 
            address newDelayAccountAddress = new DelayAccount(this, msg.sender);
            DelayAccount delayAccount = DelayAccount(newDelayAccountAddress);
            delayAccount.deposit.value(msg.value)(balance);
            userWallets[msg.sender] = AccountDetails({
                owner: msg.sender,
                bankAccount: newDelayAccountAddress,
                typeOfAccount: AccountType.delay
            });
            emit DelayAccountCreated(msg.sender, AccountType.delay, balance);
            return newDelayAccountAddress;

        } else if(_chosenType == 3){
            //trust account
            // mapping (address => bool) accountOwners;
            // accountOwners[msg.sender] = true;
            address newTrustAccountAddress = new TrustAccount(msg.sender, this);
            TrustAccount trustAccount = TrustAccount(newTrustAccountAddress);
            trustAccount.deposit.value(msg.value)(balance);
            userWallets[msg.sender] = AccountDetails({
                owner: msg.sender,
                bankAccount: newTrustAccountAddress,
                typeOfAccount: AccountType.trust
            });
            emit TrustAccountCreated(msg.sender, AccountType.trust, balance);
            return newTrustAccountAddress;

        } else {
        //     //no account was identified
            
        }
        // //TODO: lock users wallet in a function, and 
        // //TODO: create a user account with:
        //     //TODO: owner == msg.sender;
        //     //TODO: typeOfAccount == chosenType;
        //     //TODO: add adress of contract to mapping of allBankAccounts;
        //     require(unlockUser(msg.sender));
        //     return 0x0;
        //     LogEvent("Failed everthing", 10, this);
    }

    function isAccountFrozen()
        public
        view
        returns(bool lockStatus)
    {
        lockStatus = userWalletLocks[msg.sender];
    }

    event LogProgress(string _progressPoint, address _address);

    function lockAccount(address _userWalletAddressToLock)
        public
        isOwner(msg.sender)
    {
        address usersAccount = userWallets[_userWalletAddressToLock].bankAccount;
        emit LogProgress("user account: ", usersAccount);
        require(usersAccount != 0x0, "Account must exist in system");
        emit LogProgress("account is not 0x0", usersAccount);
        lockAddress(_userWalletAddressToLock);
        // AccountType usersAccountType = userWallets[_userWalletAddressToLock].typeOfAccount;
        // if(usersAccountType == AccountType.access){
        //     AccessAccount userAccountAccess = AccessAccount(usersAccount);
        //     userAccountAccess.freezeAccount();
        // } else if(usersAccountType == AccountType.delay){
        //     DelayAccount userAccountDelay = DelayAccount(usersAccount);
        //     userAccountDelay.freezeAccount();
        // } else if(usersAccountType == AccountType.trust){
        //     // TrustAccount userAccountTrust = TrustAccount(usersAccount);
        //     // userAccountTrust.freezeAccount();
        // } else {
        //     // assert(false);
        // }
    }
    
    function unlockAccount(address _userWalletAddressToUnlock)
        public
        isOwner(msg.sender)
    {
       address usersAccount = userWallets[_userWalletAddressToUnlock].bankAccount;
        require(usersAccount != 0x0, "Account must exist in system");
        AccountType usersAccountType = userWallets[_userWalletAddressToUnlock].typeOfAccount;
        if(usersAccountType == AccountType.access){
            AccessAccount userAccountAccess = AccessAccount(usersAccount);
            userAccountAccess.unfreezeAccount();
        } else if(usersAccountType == AccountType.delay){
            // DelayAccount userAccountDelay = DelayAccount(usersAccount);
            // userAccountDelay.unfreezeAccount();
        } else if(usersAccountType == AccountType.trust){
            // TrustAccount userAccountTrust = TrustAccount(usersAccount);
            // userAccountTrust.unfreezeAccount();
        } else {
            // assert(false);
        }
    }
    
    function changeOwnership(address _newAddress, address _oldAddress)
        public
        returns(bool)
    {
        //TODO: require( _bankAccount is real);
        //TODO: require( the msg.sender is an owner
        //TODO: replace the old user with the new one. 
        return true;
    }
    
    //possibly here. Move to actual trust account 
    // function addOwner(address newOwner)
    //     public 
    //     returns(bool)
    // {
    //     //TODO: if the account type is a multisig continue
    //     //TODO: check the vote has been compleated (2/3 majority)
    //     //TODO: add the new owner if vote majority true.
    //     return true;
    // }
    
    function dissolveAccount(address _fundsReciver) 
        public
        isLocked(msg.sender)
        returns(bool)
    {
        require(lockAddress(msg.sender));
        //TODO: check the struct if it has multiple owners. if the number of 
        /**
            owners is not more than 2. If it is then it requires multiple 
            signatures. Multiple signatues could be done by using a lock 
            within the vote preventing you from voting twice in the same vote,
            in this case is wether or not to delete the account and send the 
            funds to the _fundsReciver.
        */
            
        //TODO: save remaining funds as temporary variable and remove address 
            //from list
        //TODO: delete account 
        //TODO: move remaning funds to the fundsReciver
        require(unlockUser(msg.sender));
        return true;
    }
    
    //the bank calls this function if someone has frozen their account and 
    //wants to delete becuse the previous one depends on the msg.sender 
    function dissolveAccount(address _bankAccount, address _fundsReciver)
            internal
            isLocked(_bankAccount)
            returns(bool)
        {
            require(lockAddress(_bankAccount));
            //TODO: if there are multiple owners then 
                //TODO: check that the vote to delete the accout is successful
            //TODO: if its just 2 then just contunue
            //both must get proccessed as following:
            //TODO: save funds as temp
            //TODO: delete account 
            //TODO: send funds to address
            return true;
            //account gets locked forever after the account is deleted
        }
}