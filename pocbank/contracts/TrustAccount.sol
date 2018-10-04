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
        bool bankVoted;
        bool banksVote;
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
            require(allOwners[key].ownerWallet == msg.sender, "Address is not owner of Key");
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
            bool actedOn,
            bool bankVoted,
            bool banksVote

        )
    {
        typeOfVote = allBallots[_ballotID].typeOfVote;
        startTime = allBallots[_ballotID].startTime;
        endTime = allBallots[_ballotID].endTime;
        currentAddress = allBallots[_ballotID].currentAddress;
        newAddress = allBallots[_ballotID].newAddress;
        actedOn = allBallots[_ballotID].actedOn;
        bankVoted = allBallots[_ballotID].bankVoted;
        banksVote = allBallots[_ballotID].banksVote;
    }

    /**
      * @dev returns all the owners of the trust account
      */
    function getOwners()
        public
        view
        isOwner()
        returns(address[])
    {
        return owners;
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
        returns(uint newBallotID)
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
                actedOn: false,
                bankVoted: false,
                banksVote: false
            });
            newBallotID = ballotIDs;
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
                actedOn: false,
                bankVoted: false,
                banksVote: false
            });
            newBallotID = ballotIDs;
            ballotIDs++;
        }
        return newBallotID;
    }

    /**
      * @param _ballotID : the ballot ID
      * @param _vote : their vote for the ballot
      */
    function voteFor(uint _ballotID, bool _vote)
        public
        isOwner()
    {
        if(msg.sender == AccessAccount.bankAddress){
            if(_vote){
                allBallots[_ballotID].bankVoted = true;
                allBallots[_ballotID].banksVote = true;
            } else {
                allBallots[_ballotID].bankVoted = true;
                allBallots[_ballotID].banksVote = false;
            }
        } 
        else {
            require(allBallots[_ballotID].startTime > 0);
            require(allBallots[_ballotID].startTime <= now && allBallots[_ballotID].endTime > now);
            allVotesForBallot[_ballotID].push(Vote ({
                voter: msg.sender,
                vote: _vote,
                ballotID: _ballotID
            }));
        }
    }

    /**
      * @param _to : the account to send the funds to 
      * @param _amount : the amount to be withdrawn
      * @dev this allows owners to request withdraws 
      */
    function requestWithdraw(address _to, uint _amount)
        public
        isOwner()
        isFrozen()
    {
        AccessAccount.freeze();

        require(_amount < balance, "Cannot withdraw more than owned");
        createBallot(VoteType.withdrawRequest, _to, 0x0, _amount);

        AccessAccount.defrost();
    }

    event LogBallotID(uint _ballotID);

    /**
      * @param _current : the current address of the owner
      * @param _new : the new address of the owner
      * @dev this is how owners can request to change their address
      * @notice the other owners will vote on this. If the vote dose 
      *     not pass the request will fail and will not be able to be acted on.
      */
    function requestChangeOwnerAddress(address _current, address _new)
        public
        isOwner()
        isFrozen()
        returns(uint)
    {
        AccessAccount.freeze();

        require(allOwners[ownersKeys[_current]].isOwner, "Current address not recognised");
        uint ballotID = createBallot(VoteType.changeOwner, _current, _new, 0);

        AccessAccount.defrost();
        emit LogBallotID(ballotID);
        return ballotID;
    }

    /**
      * @param _new : the address of the new owner
      * @dev this is where an existing owner can request to add
      *     a new owner. 
      * @notice This will be voted for by the other owners, 
      *     and if it fails the request will not be able to be acted on.
      */
    function addOwnerRequest(address _new)
        public
        isOwner()
        isFrozen()
    {
        AccessAccount.freeze();

        createBallot(VoteType.addOwner, 0x0, _new, 0);

        AccessAccount.defrost();
    }

    /**
      * @param _toRemove : the address of the owner
      * @dev this allows owners to vote out fellow owners. 
      * @notice Owners can vote out other owners.
      */
    function removeOwnerRequest(address _toRemove)
        public
        isOwner()
        isFrozen()
    {
        AccessAccount.freeze();

        require(allOwners[ownersKeys[_toRemove]].isOwner, "Owner has already been removed");
        createBallot(VoteType.removeOwner, _toRemove, 0x0, 0);

        AccessAccount.defrost();
    }

    /**
      * @param _ballotID : the number of the ballot ID to check
      * @dev this function checks that the vote has passed, (2/3 majority)
      *     and that the ballot end time has passed
      */
    function votePassed(uint _ballotID)
        private 
        returns(bool)
    {
        if(allBallots[_ballotID].bankVoted){
            allBallots[_ballotID].actedOn = true;
            if(allBallots[_ballotID].banksVote)
                return true;
            else 
                return false;
        } else {
            require(allBallots[_ballotID].endTime < now, "Voting time has not ended. Please try again later");
            require(allBallots[_ballotID].actedOn == false, "Withdraw has already taken place");
            allBallots[_ballotID].actedOn = true;
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
    }

    /**
      * @param _ballotID : the ballots ID that the owner wants to act on
      * @dev allows an owner to act on a withdraw request
      */
    function withdraw(uint _ballotID)
        public
        isOwner()
        isFrozen()
    {
        AccessAccount.freeze();

        require(allBallots[_ballotID].amount < AccessAccount.balance, "Insufficent funds");
        require(allBallots[_ballotID].typeOfVote == VoteType.withdrawRequest);
        require(votePassed(_ballotID));

        allBallots[_ballotID].actedOn = true;
        AccessAccount.balance -= allBallots[_ballotID].amount;
        allBallots[_ballotID].currentAddress.transfer(allBallots[_ballotID].amount);

        AccessAccount.defrost();
    }

    /**
      * @param _ballotID : the ballot ID that the owner wants to act on
      * @dev allows an owner to act on a change owner requst
      */
    function changeOwnerAddress(uint _ballotID)
        public
        isOwner()
        isFrozen()
    {
        AccessAccount.freeze();

        require(allOwners[ownersKeys[allBallots[_ballotID].currentAddress]].isOwner);
        require(allBallots[_ballotID].typeOfVote == VoteType.changeOwner);
        require(votePassed(_ballotID));

        
        allOwners[ownersKeys[allBallots[_ballotID].currentAddress]].isOwner = false;
        noOfOwners++;
        ownersKeys[allBallots[_ballotID].newAddress] = noOfOwners;
        allOwners[ownersKeys[allBallots[_ballotID].newAddress]].isOwner = true;

        AccessAccount.defrost();
    }

    /**
      * @param _ballotID : the ballot ID that the owner wants to act on
      * @dev allows an owner to act on an add request
      */
    function addOwner(uint _ballotID)
        public
        isOwner()
        isFrozen()
    {
        AccessAccount.freeze();

        require(allOwners[ownersKeys[allBallots[_ballotID].currentAddress]].isOwner);
        require(allBallots[_ballotID].typeOfVote == VoteType.addOwner);
        require(votePassed(_ballotID));

        allBallots[_ballotID].actedOn = true;
        noOfOwners++;
        ownersKeys[allBallots[_ballotID].newAddress] = noOfOwners;
        allOwners[noOfOwners] = OwnerDetails({
            isOwner: true,
            ownerWallet: allBallots[_ballotID].newAddress
        });
        owners.push(allBallots[_ballotID].newAddress);

        AccessAccount.defrost();
    }

    /**
      * @param _ballotID : the ballot ID that the owner wants to act on
      * @dev allows an owner to act on a remove request
      */
    function removeOwner(uint _ballotID)
        public
        isOwner()
        isFrozen()
    {
        AccessAccount.freeze();

        require(votePassed(_ballotID));
        require(allBallots[_ballotID].typeOfVote == VoteType.removeOwner);

        allBallots[_ballotID].actedOn = true;
        allOwners[ownersKeys[allBallots[_ballotID].currentAddress]].isOwner = false;
        allOwners[ownersKeys[allBallots[_ballotID].currentAddress]].ownerWallet = 0x0;

        AccessAccount.defrost();
    }

    /**
      * @dev Allows the bank to dissolve the account. 
      * @notice the balance of the contract gets split between all the 
      *     currently active owners. 
      */
    function dissolve()
        public
        isBank()
    {
        frozen =  true;
        uint valuePerOwnerCounter = 0;

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