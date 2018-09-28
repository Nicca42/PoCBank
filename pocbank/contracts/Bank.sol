pragma solidity ^0.4.24;

contract Bank {
    
    address owner;
    enum AccountType {access, delay, trust}
    struct AccountDetails {
        address[] owners;
        address bankAccount;
        AccountType typeOfAccount;
    }
    mapping (address => AccountDetails) allBankAccountsFromUserWallet;
    mapping (address => address) userWalletsFromBankAccounts;
    
    mapping(address => bool) userWalletLocks;
    
    modifier isLocked(address userWallet) {
        //TODO: if userWallet is not a user wallet 
                //TODO: then get 
        //TODO: checks the userWalletLocks is not locked 
            //return false if locked
        //TODO: if there is a linked bankAccount check its not lockedd
            //return false if locked
        _;
    }
    
    constructor() 
        public
    {
        owner = msg.sender;
    }
    
    function lockAddress(address _toLock)
        internal
        returns(bool)
    {
        //TODO: lock the user wallet
        //TODO: lock the linked bank account if it exisits
        return true;
    }
    
    function unlockUser(address _toUnlock)
        internal
        returns(bool)
    {
        //TODO: unlock user wallet
        //TODO: unlock the linked bank account if it exisits
        return true;
    }
    
    function createBankAccount(AccountType _chosenType) 
        public
        isLocked(msg.sender)
        returns(bool)    
    {
            require(lockAddress(msg.sender));
        //TODO: lock users wallet in a function, and 
        //TODO: create a user account with:
            //TODO: owner == msg.sender;
            //TODO: typeOfAccount == chosenType;
            //TODO: add adress of contract to mapping of allBankAccounts;
            require(unlockUser(msg.sender));
            return true;
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