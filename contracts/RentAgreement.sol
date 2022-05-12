pragma solidity ^0.5.0;

contract RentAgreement {
  struct Agreement {
    address landlord;
    address tenant;
    uint createdTimestamp;
    uint rent;
    uint duration;
    string unitAddress;
  }

  mapping(uint => Agreement) public agreements;

  enum State {Created, Started, Terminated}
  State public state;

  function createAgreement(uint _listingId, uint _rent, uint _startDate, uint _duration, address _tenant, string memory _address) public {
    agreements[_listingId] = Agreement(msg.sender, _tenant, block.timestamp, _rent, _duration, _address);
  }

  event agreementConfirmed();

  event paidRent();

  event contractTerminated();

  /* Confirm the lease agreement as tenant*/
  /* function confirmAgreement() public { */
  /*   require(state == State.Created); */
  /*   require(msg.sender != landlord); */
  /*   emit agreementConfirmed(); */
  /*   tenant = msg.sender; */
  /*   state = State.Started; */
  /* } */

  /* function terminateContract() public { */
  /*   require(msg.sender == landlord); */
  /*   emit contractTerminated(); */
  /*   landlord.transfer(address(this).balance); */
  /*   state = State.Terminated; */
  /* } */

  function testFunc() public view returns (string memory) {
    return "happy hackathon";
  }
}
