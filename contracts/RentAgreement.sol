pragma solidity ^0.5.0;

contract RentAgreement {
  struct PaidRent {
    uint id;
    uint value;
  }

  PaidRent[] public paidrents;

  uint public createdTimestamp;

  uint public rent;
  string public house;

  address payable public landlord;

  address public tenant;
  enum State {Created, Started, Terminated}
  State public state;

  function createAgreement(uint _rent, string memory _house) public {
    rent = _rent;
    house = _house;
    landlord = msg.sender;
    createdTimestamp = block.timestamp;
  }
  function getPaidRents() internal returns (PaidRent[] memory) {
    return paidrents;
  }

  function getHouse() public view returns (string memory) {
    return house;
  }

  function getLandlord() public view returns (address) {
    return landlord;
  }

  function getTenant() public view returns (address) {
    return tenant;
  }

  function getRent() public view returns (uint) {
    return rent;
  }

  function getContractCreated() public view returns (uint) {
    return createdTimestamp;
  }

  function getContractAddress() public view returns (address) {
    return address(this);
  }

  function getState() public returns (State) {
    return state;
  }

  event agreementConfirmed();

  event paidRent();

  event contractTerminated();

  /* Confirm the lease agreement as tenant*/
  function confirmAgreement() public {
    require(state == State.Created);
    require(msg.sender != landlord);
    emit agreementConfirmed();
    tenant = msg.sender;
    state = State.Started;
  }

  function payRent() payable public {
    require(state == State.Started);
    require(msg.value == rent);
    require(msg.sender == tenant);
    emit paidRent();
    landlord.transfer(msg.value);
    paidrents.push(PaidRent({
      id : paidrents.length + 1,
      value : msg.value
    }));
  }

  function terminateContract() public {
    require(msg.sender == landlord);
    emit contractTerminated();
    landlord.transfer(address(this).balance);
    state = State.Terminated;
  }

  function testFunc() public view returns (string memory) {
    return "happy hackathon";
  }
}
