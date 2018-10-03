pragma solidity ^0.4.24;

import "./AccessAccount.sol";

contract TrustAccount is AccessAccount {
    //array of all the owner addresses
    address[] owners;
    //counter of all owners
    uint noOfOwners = 0;
    //ballot counter
    uint ballotIDs = 0;
    //the different types of votes
    enum VoteType {removeOwner, addOwner, changeOwner, withdrawRequest}
    //votes, containingthe voter, their vote and the ballot ID
    struct Vote {
        address voter;
        bool vote;
        uint ballotID;
    }
    //the owners, containing if they are active and all their votes
    struct OwnerDetails {
        bool isOwner;
        address ownerWallet;
        // Votes[] allVotes;
    }
    //the ballots, containing the votes specific details and an ID
    struct Ballot {
        uint ballotID;
        VoteType typeOfVote;
        uint startTime;
        uint endTime;
        address currentAddress;
        address newAddress;
        uint amount;
        bool actedOn;
    }
    //ballots to their ids
    //change to array
    mapping(uint => Ballot) allBallots;
    //all votes for the ballot
    mapping(uint => Vote[]) allVotesForBallot;
    //user keys to their details
    mapping(uint => OwnerDetails) allOwners;
    //user addresses to keys
    mapping(address => uint) ownersKeys;

    event LogCreatedTrustAccount(address[] owners, address _bank, uint _limit);

    /** 
      * @dev modifier checks that only the owner may call the function
      */
    modifier isOwner() {
        if(msg.sender == bankAddress){

        } else {
            uint key = ownersKeys[msg.sender];
            require(allOwners[key].isOwner == true, "Function only accessible by owner");
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
      * @param _voteType : the type of vote it is
      * @param _current : if it is removing / changing / adding an owner:
      *     if removing, this is the address of the owner to remove.
      *     if changing, _current is their current address.
      *     if adding an owner, current will be blank 
      *     if withdraw requset, this is the address the funds will be sent to
      * @param _new :if changing / adding an owner: 
      *     if changing, this will be their new address
      *     if adding, contains the new address
      *     if withdraw request then this is blank
      * @dev if the vote type is rejecting a withdraw requset then both addresses are empty
      */
    function createBallot(VoteType _voteType, address _current, address _new, uint _amount)
        private
    {
        if(
            _voteType == VoteType.removeOwner || 
            _voteType == VoteType.addOwner || 
            _voteType == VoteType.changeOwner
        ){
            //vote is owners modification
            allBallots[ballotIDs] = Ballot({
                ballotID: ballotIDs,
                typeOfVote: _voteType,
                startTime: now,
                //3 (days) x 24 (hours) x 60 (minutes) x 60 (secounds) = 259 200
                endTime: now + 259200,
                currentAddress: _current,
                newAddress: _new,
                amount: 0,
                actedOn: false
            });
            ballotIDs++;
        } else {
            //vote is rejecting withdraw.
            allBallots[ballotIDs] = Ballot({
                ballotID: ballotIDs,
                typeOfVote: _voteType,
                startTime: now,
                endTime: now + 259200,
                currentAddress: _current,
                newAddress: 0x0,
                amount: _amount,
                actedOn: false
            });
            ballotIDs++;
        }
    }

    /**
      * @param _ballotID : the ballots ID
      * @dev returns the details fo a single ballot
      */
    function getBallot(uint _ballotID)
        public
        view
        returns(
            VoteType typeOfVote, 
            uint startTime, 
            uint endTime, 
            address currentAddress, 
            address newAddress,
            bool actedOn
        )
    {
        typeOfVote = allBallots[_ballotID].typeOfVote;
        startTime = allBallots[_ballotID].startTime;
        endTime = allBallots[_ballotID].endTime;
        currentAddress = allBallots[_ballotID].currentAddress;
        newAddress = allBallots[_ballotID].newAddress;
        actedOn = allBallots[_ballotID].actedOn;
    }

    /**
      * @param _ballotID : the ballot ID
      * @param _vote : their vote for the ballot
      */
    function voteFor(uint _ballotID, bool _vote)
        public
        isOwner()
    {
        require(allBallots[_ballotID].startTime > 0);
        require(allBallots[_ballotID].startTime <= now && allBallots[_ballotID].endTime > now);
        allVotesForBallot[_ballotID].push(Vote ({
            voter: msg.sender,
            vote: _vote,
            ballotID: _ballotID
        }));
    }

    /**
      * @param _newOwnerAddress : the address of the new owner.
      * @dev allows the user to change the wallet assosiated with the account. 
      *     The require ensures that this function cannot be called on the trust account
      *     from the parent function (this function).
      */
    function changeOwner(address _oldOwnerAddress, address _newOwnerAddress)
        public
        isBank()
        isFrozen()
        returns(address[])
    {
        AccessAccount.freeze();

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

    //TODO: make create ballot private 
        //define interfaces

    function requestWithdraw(address _to, uint _amount)
        public
        isOwner()
        isFrozen()
        returns(uint)
    {
        AccessAccount.freeze();

        require(_amount < balance, "Cannot withdraw more than owned");
        createBallot(VoteType.withdrawRequest, _to, 0x0, _amount);

        AccessAccount.defrost();
    }

    function requestChangeOwnerAddress(address _current, address _new)
        public
        isOwner()
        isFrozen()
    {
        AccessAccount.freeze();

        require(allOwners[ownersKeys[_current]].isOwner, "Current address not recognised");
        createBallot(VoteType.changeOwner, _current, _new, 0);

        AccessAccount.defrost();
    }

    function addOwnerRequest(address _new)
        public
        isOwner()
        isFrozen()
    {
        AccessAccount.freeze();

        createBallot(VoteType.addOwner, 0x0, _new, 0);

        AccessAccount.defrost();
    }

    function removeOwnerRequest(address _toRemove)
        public
        isOwner()
        isFrozen()
    {
        AccessAccount.freeze();

        require(allOwners[ownersKeys[_toRemove]].isOwner, "Owner has already been removed");
        createBallot(VoteType.addOwner, _toRemove, 0x0, 0);

        AccessAccount.defrost();
    }

    /**
      * @param _ballotID : the number of the ballot ID to check
      * @dev this function checks that the vote has passed, (2/3 majority)
      *     and that the ballot end time has passed
      */
    function votePassed(uint _ballotID)
        private 
        view
        returns(bool)
    {
        require(allBallots[_ballotID].endTime < now, "Voting time has not ended. Please try again later");
        require(allBallots[_ballotID].actedOn == false, "Withdraw has already taken place");
        require(allVotesForBallot[_ballotID].length > 0);

        uint trueVotes = 0; 
        uint falseVotes = 0;
        for(uint i = 0; i < allVotesForBallot[_ballotID].length; i++){
            if(allVotesForBallot[_ballotID][i].vote)
                trueVotes++;
            else 
                falseVotes++;
        }
        //if it ties it fails
        if(trueVotes > falseVotes)
            return true;
        else
            return false;
    }

    /**
      * @param _ballotID : the ballots ID that the owner whishes to act on
      * @dev allows an owner to act on a withdraw request
      */
    function withdraw(uint _ballotID)
        public
        isOwner()
        isFrozen()
    {
        AccessAccount.freeze();

        require(allBallots[_ballotID].amount < AccessAccount.balance, "Insufficent funds");
        require(votePassed(_ballotID));

        allBallots[_ballotID].actedOn = true;
        AccessAccount.balance -= allBallots[_ballotID].amount;
        allBallots[_ballotID].currentAddress.transfer(allBallots[_ballotID].amount);

        AccessAccount.defrost();
    }

    function changeOwnerAddress(uint _ballotID)
        public
        isOwner()
        isFrozen()
    {
        AccessAccount.freeze();

        require(allOwners[ownersKeys[allBallots[_ballotID].currentAddress]].isOwner);
        require(votePassed(_ballotID));

        allBallots[_ballotID].actedOn = true;
        allOwners[ownersKeys[allBallots[_ballotID].currentAddress]].isOwner = false;
        ownersKeys[allBallots[_ballotID].newAddress] = ownersKeys[allBallots[_ballotID].currentAddress];
        // uint key = ownersKeys[allBallots[_ballotID].currentAddress];
        // owners[key] = allBallots[_ballotID].newAddress;

        AccessAccount.defrost();
    }

    function addOwner(uint _ballotID)
        public
        isOwner()
        isFrozen()
    {
        AccessAccount.freeze();

        require(allOwners[ownersKeys[allBallots[_ballotID].currentAddress]].isOwner);
        require(votePassed(_ballotID));

        allBallots[_ballotID].actedOn = true;
        noOfOwners++;
        ownersKeys[allBallots[_ballotID].newAddress] = noOfOwners;
        allOwners[noOfOwners] = OwnerDetails({
            isOwner: true,
            ownerWallet: allBallots[_ballotID].newAddress
        });
        // owners[noOfOwners] = allBallots[_ballotID].newAddress;

        AccessAccount.defrost();
    }

    function removeOwner(uint _ballotID)
        public
        isOwner()
        isFrozen()
    {
        AccessAccount.freeze();

        require(votePassed(_ballotID));
        allOwners[ownersKeys[allBallots[_ballotID].currentAddress]].isOwner = false;
        allOwners[ownersKeys[allBallots[_ballotID].currentAddress]].ownerWallet = 0x0;

        AccessAccount.defrost();
    }

    event LogProgress(string _desc);
    event LogValue(uint _value);

    function dissolve()
        public
        isBank()
    {
        emit LogProgress("in disolve (trust)");
        frozen =  true;
        uint valuePerOwnerCounter = 0;
        emit LogProgress("value per owner");
        emit LogValue(valuePerOwner);

        for(uint i = 0; i <= noOfOwners ; i++){
            if(allOwners[i].isOwner)
                valuePerOwnerCounter++;
        }
        uint valuePerOwner = balance / valuePerOwnerCounter;
        for(uint a = 0; i <= noOfOwners ; a++){
            if(allOwners[i].isOwner)
                allOwners[i].ownerWallet.transfer(valuePerOwner);
        }
        selfdestruct(bankAddress);
    }

}