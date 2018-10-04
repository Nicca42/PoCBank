# PoCBank
Proof of concept for an abstraction of a simplified bank. 

## How to run
Clone the repository and enter the root directory.
Open a Ganache instance and have it running on port 7545 then:
```
npm install
truffle compile
truffle test
```
If there is an out of gas error, increase the gas limit by adding an extra 0 at the end.

## Contracts
The project consists of four contracts: AccessAccount, DelayAccount, Trust(shared access) account and the bank. The access account is the parent contract for the other accounts. The access account contains all base functionality that is then overridden in the child contracts as and when needed. All accounts are subject to an account limit, which is determined by the bank on creation. This can be changed later by the bank.

Each key contract within the PoCBank system is outlined below:
`AccessAccount.sol` The access account can be created through the bank and allowed for withdraws and limited deposits. 
`DelayAccount.sol` The delay account can be created through the bank and allows for deposits and can request a withdrawal and 30 days later, the requested amount can be withdraw.
`TrustAccount.sol` The trust account allows for the creation of a group owned account where decisions such as withdrawal, adding/removing/changing of owners can be voted on. A majority vote is required to pass the change and fails in the case of a tie. Anyone can deposit into the account, given it meets the limit requirements.
`Bank.sol` The bank has the ability to create any account type, change any account owner and modify account limits (both existing and future accounts). The bank can also freeze and defrost any account preventing core functionality from executing while frozen.

## Testing
Comprehensive testing on all contracts has been done. 

The block below shows the code test coverage. It comprehensively covers all core functionality in many different instances, as each test for the accounts tests the contracts functionality independently of the bank. 

```
--------------------|----------|----------|----------|----------|----------------|
File 	              | % Stmts  | % Branch | % Funcs  | % Lines  |Uncovered Lines |
--------------------|----------|----------|----------|----------|----------------|
contracts/          | 89.78    | 65.31    | 89.09    | 91.14    |                |
AccessAccount.sol   | 94.29    | 70       | 88.24    | 94.87    | 80,234         |
Bank.sol            | 91.11    | 50       | 89.47    | 91.38    | 35,36,37,38,94 |
DelayAccount.sol    | 100      | 75       | 100      | 100      |                |
TrustAccount.sol    | 85.56    | 64.52    | 87.5     | 88.24    | 309,444,445    |
--------------------|----------|----------|----------|----------|----------------|
All files           | 89.78    | 65.31    | 89.09    | 91.14    |                |
--------------------|----------|----------|----------|----------|----------------|
```

## Design Decisions
This project uses mutexes, separation of concerns, modular testing, and optimization by using `solc` compiler. 

## Planning
This project uses inheritance. Initially it was not going to and I was going to have each contract as a separate entity, but using the various functions from the bank contract without a parent class where the functions are be unified proved inefficient.
<p align="center">  
  <img
   src="https://github.com/Nicca42/PoCBank/blob/master/img/Inheritance.JPG" alt="Inheritance"/>
  <br>
</p>

Additional images relating to planning can be found within the img directory in the repo.



