pragma solidity ^0.4.24;

contract TrustAccount {
    mapping (address => bool) accountOwners;
    address bank;
    uint balance;
    
    enum VoteTypes {dissolve, freeze, withdraw, addOwner, deleteOwner}
    struct OwnerVotes {
        address owner;
        VoteTypes typeOfVote;
        bool voted;
    }
    struct voteDetails{
        VoteTypes vote;
        mapping (address => bool) owners;
        OwnerVotes ifVotedForTypes;
        bool[] votes;
        bool compleated;
    }
    
    voteDetails[] internal historyOfVotes;
    
    modifier onlyOwner(address isOwner){
        require(isOwner == bank || accountOwners[isOwner] == true, "Must be owner");
        _;
    }
    
    modifier haveNotVoted(address owner){
        //TODO: if the owner has not voted on this vote, dont fail
        _;
    }
    
    constructor(address _initialOwners, address _bank)
    {
        //TODO: 
        // accountOwners = _owners;
        accountOwners[_initialOwners] = true;
        bank = _bank;
    }
    
    /**
        @param _against : if they are voting yes this is true.
    */
    function vote(VoteTypes _voteType, bool _against)
        public
        onlyOwner(msg.sender)
        haveNotVoted(msg.sender)
        returns(bool)
    {
        //TODO: lock them for this specific vote type
        //TODO: make their vote what they voted. 
        return true;
    }
    
    function getVotes(VoteTypes _voteType)
        internal
        returns(bool[])
    {
        //TODO: get the votes of the owners
        //TODO: checks that the time has passsed
        //TODO: assert fail if time has not passed. 
        //TODO: check in the history of all the others for:
            //TODO: any vote after a dissolve 
            //TODO: no votes during a freeze 
    }

    function deposit(uint _amount)
        public 
        payable
        onlyOwner(msg.sender)
        //TODO: lockAccount
    {
        balance += msg.value;
        //TODO: lockAccount();
        //TODO: unlockAccount();
    }
    
    function viewBalance()
        public
        view
        onlyOwner(msg.sender)
        returns(uint)
    {
        return balance;
    }
}