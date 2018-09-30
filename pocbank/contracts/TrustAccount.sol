pragma solidity ^0.4.24;

import "./Bank.sol";

contract TrustAccount {
    mapping (address => bool) accountOwners;
    address[] accountOwnersList;
    address bank;
    uint balance;
    bool frozen = false;
    
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
    
    modifier hasVoted(address owner, VoteTypes _vote){
        //TODO: if the owner has not voted on this vote, dont fail
        _;
    }

    // modifier frozonCheck() {
    //     require(!frozen, "Account is frozon. Please unfreeze");
    //     Bank bankOb = Bank(bank);
    //     bool isFrozenInBank = bankOb.isAccountFrozen(accountOwners[]);
    //     require(!isFrozenInBank, "Account is frozon. Please unfreeze");
    //     _;
    // }
    
    constructor(address _initialOwners, address _bank)
    {
        //TODO: 
        // accountOwners = _owners;
        accountOwners[_initialOwners] = true;
        bank = _bank;
    }

    function freezeAccount()
        public
        onlyOwner(msg.sender)
        returns(bool)
    {
        assert(frozen == false);
        frozen = true;
        return true;
    }
    
    function unfreezeAccount()
        public
        onlyOwner(msg.sender)
        returns(bool)
    {
        assert(frozen == true);
        frozen = false;
        return true;
    }
    
    /**
        @param _against : if they are voting yes this is true.
    */
    function vote(VoteTypes _voteType, bool _against)
        public
        onlyOwner(msg.sender)
        hasVoted(msg.sender, _voteType)
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