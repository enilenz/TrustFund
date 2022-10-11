var TrustFund = artifacts.require("TrustFund");
var TrustFundToken1 = artifacts.require("TrustFundToken1");
var TrustFundToken2 = artifacts.require("TrustFundToken2");
var TrustFundNFT1 = artifacts.require("TrustFundERC721Token1");
var TrustFundNFT2 = artifacts.require("TrustFundERC721Token2");

module.exports = async function(deployer, network, accounts) {
  const benefactor = accounts[1];
  const spender = accounts[2];

  await deployer.deploy(TrustFund, benefactor, spender, {value: 1});
  await deployer.deploy(TrustFundToken1, benefactor);
  await deployer.deploy(TrustFundToken2, benefactor);
  await deployer.deploy(TrustFundNFT1, benefactor);
  await deployer.deploy(TrustFundNFT2, benefactor);

  const tk1 = await TrustFundToken1.deployed();
  const result = await tk1.balanceOf(benefactor);
  console.log("token1", result.toString());

  const nft1 = await TrustFundNFT1.deployed();
  const nft2 = await TrustFundNFT2.deployed();

  const result1 = await nft1.ownerOf(1);
  const result2 = await nft2.ownerOf(1);

  console.log("nft1", result1.toString());
  console.log("nft2", result2.toString());

};

