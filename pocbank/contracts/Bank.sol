pragma solidity ^0.4.24;

import "./AccessAccount.sol";
import "./DelayAccount.sol";
import "./TrustAccount.sol";

contract Bank {
    address owner;

    constructor(){
        owner = msg.sender;
    }
}