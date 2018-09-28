pragma solidity ^0.4.24;

contract SharedTrustAccount {
    address[] owners;
    address bank;
    
    enum VoteTypes {dissolve, freeze, withdraw, addOwner, deleteOwner}
    struct OwnerVotes {
        address owner;
        VoteTypes typeOfVote;
        bool voted;
    }
    struct voteDetails{
        VoteTypes vote;
        address[] owners;
        OwnerVotes ifVotedForTypes;
        bool[] votes;
        bool compleated;
    }
    
    voteDetails[] internal historyOfVotes;
    
    modifier onlyOwners(address isOwner){
        //TODO: if the address is an owner, dont fail
        _;
    }
    
    modifier haveNotVoted(address owner){
        //TODO: if the owner has not voted on this vote, dont fail
        _;
    }
    
    constructor(address[] _owners, address _bank;)
    {
        //TODO: 
        if(owners.length  < 50){
            owners = _owners;
            bank = _bank;
            //return true;
        } else {
            //return false;
        }
    }
    
    /**
        @param _against : if they are voting yes this is true.
    */
    function vote(VoteTypes _voteType, bool _against)
        public
        onlyOwners(msg.sender)
        haveNotVoted(msg.sender)
        returns(bool)
    {
        //TODO: lock them for this specific vote type
        //TODO: make their vote what they voted. 
        return true;
    }
    
    function getVotes(VoteTypes _voteType)
        internal
        return(bool[])
    {
        //TODO: get the votes of the owners
        //TODO: checks that the time has passsed
        //TODO: assert fail if time has not passed. 
        //TODO: check in the history of all the others for:
            //TODO: any vote after a dissolve 
            //TODO: no votes during a freeze 
    }
}