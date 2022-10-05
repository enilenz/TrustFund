var TrustFund = artifacts.require("TrustFund");
var TrustFundToken1 = artifacts.require("TrustFundToken1");
var TrustFundToken2 = artifacts.require("TrustFundToken2");

module.exports = async function(deployer, network, accounts) {
  const benefactor = accounts[1];
  const spender = accounts[2];

  await deployer.deploy(TrustFund, benefactor, spender, {value: 1});
  await deployer.deploy(TrustFundToken1, benefactor);
  await deployer.deploy(TrustFundToken2, benefactor);

  const tk1 = await TrustFundToken1.deployed();
  const result = await tk1.balanceOf(benefactor);
  console.log("token1", result.toString());

};

