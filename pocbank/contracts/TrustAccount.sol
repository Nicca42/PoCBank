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

    /**
      * @param _voteType : the type of vote it is
      * @param _current : if it is removing / changing / adding an owner:
      *     if removing, _new will be empy.
      *     if changing, _current is their current address, _new is the address
      *         to replace them with
      *     if adding an owner, current will be blank and _new will contain their address
      *     if withdraw requset the current is the address the funds would go to
      * @param _new :if changing / adding an owner: 
      *     if changing, this will be their new address, and current will be their old one
      *     if adding, the _current will be blank and _new will contain the new address
      *     if withdraw request then this is blank
      * @dev if the vote type is rejecting a withdraw requset then both addresses are empty
      */
    function createVote(VoteType _voteType, address _current, address _new, uint _amount)
        public
        isOwner()
    {
        //TODO: change to create ballot
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

    // /**
    //   * @param _ballotID : the ballot ID
    //   */
    // function actOnVote(uint _ballotID)
    //     public
    //     isOwner()
    // {
    //     require(allBallots[_ballotID].endTime < now, "Vote end time has not been reached yet");
    //     allBallots[_ballotID].actedOn = false;
    //     uint votesTrue = 0;
    //     uint votesFalse = 0;
    //     uint numberOfVotes = allVotesForBallot[_ballotID].length;
    //     for(uint i = 0; i < numberOfVotes; i++){
    //         bool temp = allVotesForBallot[_ballotID][i].vote;
    //         if(temp)
    //             votesTrue++;
    //         else 
    //             votesFalse++;
    //     }
    //     if(votesTrue > votesFalse){
    //         //do the thing
    //         if(allBallots[_ballotID].typeOfVote == VoteType.removeOwner){
    //             allOwners[ownersKeys[allBallots[_ballotID].currentAddress]]
    //         }
    //         if(allBallots[_ballotID].typeOfVote == VoteType.addOwner){

    //         }
    //         if(allBallots[_ballotID].typeOfVote == VoteType.changeOwner){

    //         }
    //         if(allBallots[_ballotID].typeOfVote == VoteType.withdrawRequest){

    //         }
    //     } else {
    //         //dont do the thing
    //     }
    // }

    

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
        //reqire(isBallotValid(_ballotID));
        //requre(ballot[_ballotID].startTime > now && ballot[_ballotID].endTime < now);
        allVotesForBallot[_ballotID].push(Vote ({
            voter: msg.sender,
            vote: _vote,
            ballotID: _ballotID
        }));
    }

    function requestOwner(VoteType _chosenType)
        public
        view
    {
        if(_chosenType == VoteType.withdrawRequest){
            require(false);
        }
        //set individual variables depending on type of account
        //eg
        //if its remove owner, make new address 0x0 and use
        //request changing of owership
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

    //TODO: make create ballot private 
        //define interfaces

    function requestWithdraw(address _to, uint _amount)
        public
        isOwner()
        isFrozen()
        returns(uint)
    {
        require(_amount < balance, "Cannot withdraw more than owned");
        this.createVote(VoteType.withdrawRequest, _to, 0x0, _amount);
    }

    // event LogProgress(string _desc);

    function withdraw(uint _requstNo)
        public
        isOwner()
        isFrozen()
    {
        emit LogProgress("inside withdraw trust account");
        // require(allBallots[_requstNo].typeOfVote == VoteType.withdrawRequest, "Invalid request number");
        require(allBallots[_requstNo].endTime < now, "Voting time has not ended. Please try again later");
        require(allBallots[_requstNo].actedOn == false, "Withdraw has already taken place");
        require(allBallots[_requstNo].amount < AccessAccount.balance, "Insufficent funds");
        emit LogProgress("After all requires");
        //require(votePassed(uint _requestNo));

        allBallots[_requstNo].actedOn = true;
        AccessAccount.balance -= allBallots[_requstNo].amount;
        allBallots[_requstNo].currentAddress.transfer(allBallots[_requstNo].amount);
    }

    // /**
    //   * @param _amount : the amount to be withdrawn 
    //   * @dev only allows the owner(s) to withdraw. Dose not allow use if account is frozen 
    //   *     (or dissolved). Ensures the usage of witdraw in the child contracts for both delay
    //   *     contracts and trust contracts. 
    //   */
    // function withdraw(uint _amount)
    //     public
    //     isOwner()
    //     isFrozen()
    // {
    //     AccessAccount.freeze();

    //     require(thisAccountType != AccountType.trust, "Please use withdraw function in trust contract");
    //     require(thisAccountType != AccountType.delay, "Please use withdraw function in delay contract");
    //     require(_amount <= balance, "Cannot withdraw more funds than available");
    //     balance -= _amount;
    //     onwerAddress.transfer(_amount);

    //     AccessAccount.defrost();
    // }

    event LogProgress(string _desc);
    event LogValue(uint _value);

    function dissolve()
        public
        isBank()
    {
        emit LogProgress("in disolve (trust)");
        frozen =  true;
        uint valuePerOwner = balance / owners.length;
        emit LogProgress("value per owner");
        emit LogValue(valuePerOwner);
        for(uint i = 0; i <= owners.length; i++){
            // owners[i].transfer(valuePerOwner);
        }
        // for(uint i = 0; i <= noOfOwners; i++){
        //     emit LogProgress("in for loop");
        //     emit LogValue(i);
        //     uint key = ownersKeys[owners[i]];
        //     if(allOwners[key].isOwner == true){
        //         owners[i].transfer(valuePerOwner);
        //     }
        // }
        selfdestruct(bankAddress);
    }
}