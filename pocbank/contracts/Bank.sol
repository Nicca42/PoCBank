pragma solidity ^0.4.24;

import "./AccessAccount.sol";

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
        internal
        returns(bool)
    {
        require(userWalletLocks[_toLock] == false, "User wallet already locked");
        userWalletLocks[_toLock] = true;
        return true;
    }
    
    function unlockUser(address _toUnlock)
        internal
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
        if(_chosenType == 1){
            // access account
            address newAccountAddress = new AccessAccount(this, msg.sender);
            uint balance = msg.value;
            AccessAccount newAccount = AccessAccount(newAccountAddress);
            newAccount.deposit.value(msg.value)(balance);
            userWallets[msg.sender] = AccountDetails({
                owner: msg.sender,
                bankAccount: newAccountAddress,
                typeOfAccount: AccountType.access
            });
            
            emit AccessAccountCreated(msg.sender, AccountType.access, balance);
            
            return newAccountAddress;
            
        } else if(_chosenType == 2){
        //     //delay, 30 days, account 
            
        } else if(_chosenType == 3){
        //     //trust account
            
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
        returns(bool)
    {
        return userWalletLocks[msg.sender];
    }
    
    function freezeAccount(address _bankAccounts)
        public
        returns(bool)
    {
        //TODO: require( _bankAccount is real);
        //TODO: require( the msg.sender is an owner
        //TODO: if there are multiple owners then check they have voted
        //TODO: freeze the account
        return true;
    }
    
    function unfreezeAccount(address _bankAccount)
        public
        returns(bool)
    {
        //TODO: require( _bankAccount is real);
        //TODO: require( the msg.sender is an owner
        //TODO: unfreeze the account
        return true;
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