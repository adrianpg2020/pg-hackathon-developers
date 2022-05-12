var RentAgreement = artifacts.require("RentAgreement");

module.exports = function(deployer) {
  deployer.deploy(RentAgreement);
};
