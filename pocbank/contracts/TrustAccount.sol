pragma solidity ^0.4.24;

import "./AccessAccount.sol";

contract TrustAccount is AccessAccount {
    address[] owners;
    uint noOfOwners = 0;
    struct OwnerDetails {
        bool isOwner;
        address ownerWallet;
    }
    mapping(uint => OwnerDetails) allOwners;

    event LogCreatedTrustAccount(address[] owners, address _bank, uint _limit);

    modifier isOwner() {
        uint temp = noOfOwners;
        if(msg.sender == AccessAccount.bankAddress){
            //checks the msg.sender is the bank, if it is it skipps the next check
        } else {
            //checks the user is not one of the other owners, fails if it runs out of 
            //owners tocheck.
            for(uint i = temp; i > 0; i++){
                if(allOwners[temp].ownerWallet == msg.sender){
                    require(allOwners[temp].isOwner == true, "Owner is not active");
                    require(temp >= 0, "Function only usable by owner");
                    break;
                }
            }
        }
        _;
    }

    /**
      * @dev the constructor sets the owner in the access account to the bank as 
      *     all the owners need equal status and replacability. 
      */
    constructor(address[] _owners, uint _limit)
        AccessAccount(msg.sender, AccessAccount.AccountType.trust, _limit)
        public
    {
        AccessAccount.onwerAddress = msg.sender;
        bankAddress = msg.sender;
        AccessAccount.accountLimit = _limit;
        uint noOfOwnersInArray = _owners.length;
        for(uint i = 0; i < noOfOwnersInArray; i++){
            allOwners[noOfOwners] = OwnerDetails({
                isOwner: true,
                ownerWallet: _owners[0]
            });
            noOfOwners++;
        }
        emit LogCreatedTrustAccount(_owners, msg.sender, _limit);
    }

    /**
      * @param _newOwnerAddress : the address of the new owner.
      * @dev allows the user to change the wallet assosiated with the account. 
      *     The require ensures that this function cannot be called on the trust account
      *     from the parent function (this function).
      */
    function changeOwner(address _newOwnerAddress, address _oldOwnerAddress)
        public
        isOwner()
        isFrozen()
    {
        AccessAccount.freeze();

        uint temp = noOfOwners;
        if(allOwners[temp].ownerWallet == _oldOwnerAddress){
            allOwners[temp].ownerWallet = _newOwnerAddress;
            require(temp > 0, "Old Owner Address Not recognised");
        }
        for(uint i = temp; i > 0; i++){
                if(allOwners[temp].ownerWallet == _oldOwnerAddress){
                    require(allOwners[temp].isOwner == true, "Owner is not active");
                    require(temp >= 0, "Function only usable by owner");
                    break;
                }
            }

        AccessAccount.defrost();
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
        AccessAccount.freeze();

        require(thisAccountType != AccountType.trust, "Please use withdraw function in trust contract");
        require(thisAccountType != AccountType.delay, "Please use withdraw function in delay contract");
        require(_amount <= balance, "Cannot withdraw more funds than available");
        balance -= _amount;
        onwerAddress.transfer(_amount);

        AccessAccount.defrost();
    }
}