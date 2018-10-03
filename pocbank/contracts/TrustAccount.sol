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
    mapping(address => uint) ownersKeys;

    event LogCreatedTrustAccount(address[] owners, address _bank, uint _limit);

    /** 
      * @dev modifier checks that only the owner may call the function
      */
    modifier isOwner() {
        uint key = ownersKeys[msg.sender];
        require(allOwners[key].isOwner == true);
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
            ownersKeys[_owners[i]] = i;
            allOwners[i] = OwnerDetails({
                isOwner: true,
                ownerWallet: _owners[i]
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
    function changeOwner(address _oldOwnerAddress, address _newOwnerAddress)
        public
        isOwner()
        isFrozen()
        returns(address[])
    {
        AccessAccount.freeze();

        //struct OwnerDetails {
        //     bool isOwner;
        //     address ownerWallet;
        // }
        // uint memory temp = noOfOwners;
        // if(allOwners[temp].ownerWallet == _oldOwnerAddress){
        //     allOwners[temp].ownerWallet = _newOwnerAddress;
        //     require(temp > 0, "Old Owner Address Not recognised");
        // }
        for(uint i = noOfOwners; i > 0; i--){
            if(allOwners[i].ownerWallet == _oldOwnerAddress){
                require(allOwners[i].isOwner == true, "Owner is not active");
                require(i >= 0, "Function only usable by owner");
                break;
            }
        }
        for(uint b = noOfOwners; b > 0; b--){
            if(allOwners[b].ownerWallet == _oldOwnerAddress){
                allOwners[b].ownerWallet = _newOwnerAddress;
                allOwners[b].isOwner = true;
                owners[b] = _newOwnerAddress;
            }
        }

        AccessAccount.defrost();
        return owners;
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

    function dissolve()
        public
        isBank()
    {
        frozen =  true;
        uint valuePerOwner = balance / noOfOwners;
        for(uint i = 0; i <= noOfOwners; i++){
            uint key = ownersKeys[owners[i]];
            if(allOwners[key].isOwner == true){
                owners[i].transfer(valuePerOwner);
            }
        }
        selfdestruct(bankAddress);
    }
}