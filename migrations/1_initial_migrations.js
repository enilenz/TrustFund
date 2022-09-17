var TrustFund = artifacts.require("TrustFund");
var MetaCoin = artifacts.require("MetaCoin");

module.exports = async function(deployer, network, accounts) {

  const val = await deployer.deploy(TrustFund, accounts[1], accounts[2], {value: 1});
  await deployer.deploy(MetaCoin);

};