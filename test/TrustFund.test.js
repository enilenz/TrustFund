const TrustFund = artifacts.require("TrustFund");
const TrustFundToken1 = artifacts.require("TrustFundToken1");
const TrustFundToken2 = artifacts.require("TrustFundToken2");
const TrustFundNFT1 = artifacts.require("TrustFundERC721Token1");
const TrustFundNFT2 = artifacts.require("TrustFundERC721Token2");

function tokens(n){
    return web3.utils.toWei(n, 'ether');
}

//1000000000000000000000

contract("TrustFund", async(accounts) => {
    let trustFund, trustFundAddress, benefactor, spender;
    let trf1, trf2, trf1Addr, trf2Addr, approvalResult1, approvalResult2;
    let nft1, nft2, nft1Addr, nft2Addr;

    before(async() => {
         trustFund = await TrustFund.deployed();
         trustFundAddress = trustFund.address;
         benefactor = accounts[1];
         spender = accounts[2];
    });

    describe("contract deployment", async() => {
        it("should return addresses of participants", async() => {
            const benefactorAddr = await trustFund.getBenefactor();
            const spenderAddr = await trustFund.getSpender();
            assert.equal(benefactor, benefactorAddr);
            assert.equal(spender, spenderAddr);
        });

        it("should ensure lockDuration is non zero",  async() => {
            const lock = await trustFund.lockDuration();
            assert.notEqual(lock, 0);
        })

        it("should ensure eth sent on contract deployment", async() => {
            const balance  = await web3.eth.getBalance(trustFundAddress);
            assert.notEqual(balance, 0);
        })
    });

    describe("ERC20 tokens with zero balance, (initial deposit)", async() => {
        // let trf1, trf2, trf1Addr, trf2Addr, approvalResult1, approvalResult2

        before(async() => {
            trf1 = await TrustFundToken1.deployed();
            trf2 = await TrustFundToken2.deployed();
            trf1Addr = trf1.address;
            trf2Addr = trf2.address;

            approvalResult1 = await trf1.approve(trustFundAddress, tokens('1000'), {from: benefactor});
            approvalResult2 = await trf2.approve(trustFundAddress, tokens('1000'), {from: benefactor});

        })

        it("should ensure correct approval of tokens", async() => {
            const ownerAddress1 = await approvalResult1.logs[0].args.owner;
            const ownerAddress2 = await approvalResult2.logs[0].args.owner;
            assert.equal(ownerAddress1, benefactor);
            assert.equal(ownerAddress2, benefactor);

            const spenderAddress1 = await approvalResult1.logs[0].args.spender;
            const spenderAddress2 = await approvalResult2.logs[0].args.spender;
            assert.equal(spenderAddress1, trustFundAddress);
            assert.equal(spenderAddress2, trustFundAddress);

            let allowance1 = await trf1.allowance(benefactor, trustFundAddress, {from: benefactor});
            let allowance2 = await trf2.allowance(benefactor, trustFundAddress, {from: benefactor});
            assert.equal(1000000000000000000000, allowance1.toString());
            assert.equal(1000000000000000000000, allowance2.toString());

        })


        it("should return balance of benefactor", async() => {
            const val = await trf1.balanceOf(benefactor);
            const val2 = await trf2.balanceOf(benefactor);
            assert.equal(1000000000000000000000, val.toString());
            assert.equal(1000000000000000000000, val2.toString());
        });

        it("should send money and return appropriate balances", async() => {
            let _trf1, _trf2;
            _trf1 = await trustFund.depositERC20Asset.sendTransaction(trf1Addr, tokens('100'), "trf1" , {from: benefactor});
            _trf2 = await trustFund.depositERC20Asset.sendTransaction(trf2Addr, tokens('100'), "trf2" , {from: benefactor});
            let bal1 = await trf1.balanceOf(trustFundAddress);
            let bal2 = await trf2.balanceOf(trustFundAddress);
            assert.equal(tokens('100'), bal1.toString());
            assert.equal(tokens('100'), bal2.toString());

            bal1 = await trf1.balanceOf(benefactor);
            bal2 = await trf2.balanceOf(benefactor);

            assert.equal(tokens('900'), bal1.toString());
            assert.equal(tokens('900'), bal2.toString());

            // check balance using contract function
            const balCon1 = await trustFund.checkBalance.call(trf1Addr);
            const balCon2 = await trustFund.checkBalance.call(trf2Addr);
            assert.equal(tokens('100'), balCon1.toString());
            assert.equal(tokens('100'), balCon2.toString());

            // after deposit it("should get number of assets")
            const assetNumber = await trustFund.getNumberOfAssets({from: benefactor});
            assert.equal(2, assetNumber.toString());

            // after deposit it("should check if asset is in contract")
            const truthVal1 = await trustFund.checkAssetIsInContract(trf1Addr);
            const truthVal2 = await trustFund.checkAssetIsInContract(trf2Addr);
            assert.isTrue(truthVal1);
            assert.isTrue(truthVal2);

            // after deposit it("should return asset information after deposit")
            const assetInfo1 = await trustFund.getAssetInformation(trf1Addr);
            assert.equal(trf1Addr, assetInfo1.add);
            assert.equal(tokens('100'), assetInfo1.b);
            assert.equal("trf1", assetInfo1.s);

            const assetInfo2 = await trustFund.getAssetInformation(trf2Addr);
            assert.equal(trf2Addr, assetInfo2.add);
            assert.equal(tokens('100'), assetInfo2.b);
            assert.equal("trf2", assetInfo2.s);

            // after deposit it should ensure token address in  allAssets array
            const assetAddresses = await trustFund.getAssetAddresses.call();
            assert.equal(assetAddresses[0], trf1Addr);
            assert.equal(assetAddresses[1], trf2Addr);
           
        })

        it("should withdraw an asset", async() => {
            // check balances 
            let trf2bal = await trf2.balanceOf(trustFundAddress);
            let ben2bal = await trf2.balanceOf(benefactor);

            assert.equal(tokens('100'), trf2bal.toString());
            assert.equal(tokens('900'), ben2bal.toString()); 

            let withdrawalResult2 = await trustFund.withdrawERC20Asset(trf2Addr, tokens('50'), {from: benefactor});

            const truthVal2 = await trustFund.checkAssetIsInContract(trf2Addr);
            assert.isTrue(truthVal2);

            let assetNumber = await trustFund.getNumberOfAssets({from: benefactor});
            assert.equal(2, assetNumber.toString());

            const balCon2 = await trustFund.checkBalance.call(trf2Addr);
            let bal2 = await trf2.balanceOf(trustFundAddress);
            assert.equal(bal2.toString(), balCon2.toString());



            let trf1bal = await trf1.balanceOf(trustFundAddress);
            let ben1bal = await trf1.balanceOf(benefactor);

            assert.equal(tokens('100'), trf1bal.toString());
            assert.equal(tokens('900'), ben1bal.toString()); 

            let withdrawalResult1 = await trustFund.withdrawERC20Asset(trf1Addr, tokens('50'), {from: benefactor});

            const truthVal1 = await trustFund.checkAssetIsInContract(trf1Addr);
            assert.isTrue(truthVal1);

            assetNumber = await trustFund.getNumberOfAssets({from: benefactor});
            assert.equal(2, assetNumber.toString());

            ben1bal = await trf1.balanceOf(benefactor);
            assert.equal(ben1bal.toString(), tokens('950'));

            const assetInfo1 = await trustFund.getAssetInformation(trf1Addr);
            assert.equal(trf1Addr, assetInfo1.add);
            assert.equal(tokens('50'), assetInfo1.b);
            assert.equal("trf1", assetInfo1.s);

        })

    })

    describe("ERC721 token tests", async() => {

        // let nft1, nft2, nft1Addr, nft2Addr

        before(async() => {
            nft1 = await TrustFundNFT1.deployed();
            nft2 = await TrustFundNFT2.deployed();
            nft1Addr = nft1.address;
            nft2Addr = nft2.address;

            await nft1.approve(trustFundAddress, 0, {from: benefactor});
            await nft1.approve(trustFundAddress, 1, {from: benefactor});
            await nft2.approve(trustFundAddress, 0, {from: benefactor});
            await nft2.approve(trustFundAddress, 1, {from: benefactor});

        })

        it("should ensure contract deployed properly", async() => {
            const name1 = await nft1.name();
            const name2 = await nft2.name();

            assert.equal(name1.toString(), "TrustFund NFT 1");
            assert.equal(name2.toString(), "TrustFund NFT 2");

            const symbol1 = await nft1.symbol();
            const symbol2 = await nft2.symbol();

            assert.equal(symbol1.toString(), "TRF-NFT1");
            assert.equal(symbol2.toString(), "TRF-NFT2");
        });

        it("should ensure proper ownership and approval of nft", async() => {
            const nftownerOf10 = await nft1.ownerOf(0);
            const nftownerOf11 = await nft1.ownerOf(1);
            assert.equal(benefactor, nftownerOf10);
            assert.equal(benefactor, nftownerOf11);

            const nftownerOf20 = await nft2.ownerOf(0);
            const nftownerOf21 = await nft2.ownerOf(1);
            assert.equal(benefactor, nftownerOf20);
            assert.equal(benefactor, nftownerOf21);

            const nftbalanceOf1 = await nft1.balanceOf(benefactor);
            assert.equal(2, nftbalanceOf1.toString());
            const nftbalanceOf2 = await nft2.balanceOf(benefactor);
            assert.equal(2, nftbalanceOf2.toString());

            const getApp10 = await nft1.getApproved(0);
            const getApp11 = await nft1.getApproved(0);
            assert.equal(trustFundAddress, getApp10.toString());
            assert.equal(trustFundAddress, getApp11.toString());

            const getApp20 = await nft2.getApproved(0);
            const getApp21 = await nft2.getApproved(0);
            assert.equal(trustFundAddress, getApp20.toString());
            assert.equal(trustFundAddress, getApp21.toString());

            
        });

        it("should deposit nft to contract", async() => {

            const nft1deposit = await trustFund.depositERC721Asset(nft1Addr, 0, "nft1", {from: benefactor});

            let nft1benefactorBalance = await nft1.balanceOf(benefactor);
            let nft1trustfundBalance = await nft1.balanceOf(trustFundAddress);
            assert.equal(1, nft1benefactorBalance.toString());
            assert.equal(1, nft1trustfundBalance.toString());

            // after deposit it("should get number of assets")
            let assetNumber = await trustFund.getNumberOfAssets({from: benefactor});
            assert.equal(3, assetNumber.toString());

            // after deposit it("should check if asset is in contract")
            const nft1add = await trustFund.checkAssetIsInContract(nft1Addr);
            assert.isTrue(nft1add);

            // after deposit it("should return asset information after deposit")
            let assetInfo1 = await trustFund.getAssetInformation.call(nft1Addr);
            assert.equal(nft1Addr, assetInfo1.add);
            assert.equal(0, assetInfo1.ids[0].toString());
            assert.equal("nft1", assetInfo1.s);

            // after deposit it should ensure token address in  allAssets array
            let assetAddresses = await trustFund.getAssetAddresses.call();
            assert.equal(assetAddresses[2], nft1Addr);

            const nft1depositS = await trustFund.depositERC721Asset(nft1Addr, 1, "nft1", {from: benefactor});

            nft1benefactorBalance = await nft1.balanceOf(benefactor);
            nft1trustfundBalance = await nft1.balanceOf(trustFundAddress);
            assert.equal(0, nft1benefactorBalance.toString());
            assert.equal(2, nft1trustfundBalance.toString());

            // after deposit it("should return asset information after deposit")
            assetInfo1 = await trustFund.getAssetInformation.call(nft1Addr);
            assert.equal(nft1Addr, assetInfo1.add);
            assert.equal(1, assetInfo1.ids[1].toString());
            assert.equal("nft1", assetInfo1.s);

            const nft2deposit = await trustFund.depositERC721Asset(nft2Addr, 0, "nft2", {from: benefactor});
            await trustFund.depositERC721Asset(nft2Addr, 1, "nft2", {from: benefactor});
            assetNumber = await trustFund.getNumberOfAssets({from: benefactor});
            assert.equal(4, assetNumber.toString());

        })

        it("should withdraw nft", async() => {
            let assetLength = await trustFund.getNumberOfAssets();
            let withdrawlResult = await trustFund.withdrawERC721Asset(nft1Addr, 1, {from: benefactor});

            let assetInfo1 = await trustFund.getAssetInformation.call(nft1Addr);
            assert.equal(nft1Addr, assetInfo1.add);
            assert.equal(0, assetInfo1.ids.toString());
            assert.equal("erc721", assetInfo1.t);
            assert.equal(4, assetLength.toString());

            const allAdd = await trustFund.getAssetAddresses.call();
            console.log(allAdd);

        })
  
    })

    describe("withdrawAll functions", async() =>{
        it("should withdraw all ERC20 assets", async() => {
            let ben1bal = await trf1.balanceOf(benefactor);
            let ben2bal = await trf2.balanceOf(benefactor);
            assert.equal(ben1bal.toString(), tokens('950'));
            assert.equal(ben2bal.toString(), tokens('950'));

            let checkToken1 = await trustFund.checkAssetIsInContract.call(trf1Addr);
            let checkToken2 = await trustFund.checkAssetIsInContract.call(trf2Addr);
            assert.isTrue(checkToken1);
            assert.isTrue(checkToken2);
            
            const withdrawAll = await trustFund.withdrawAllERC20Assets({from: benefactor});

            checkToken1 = await trustFund.checkAssetIsInContract.call(trf1Addr);
            checkToken2 = await trustFund.checkAssetIsInContract.call(trf2Addr);
            assert.isFalse(checkToken1);
            assert.isFalse(checkToken2);

            ben1bal = await trf1.balanceOf(benefactor);
            ben2bal = await trf2.balanceOf(benefactor);
            con1bal = await trf1.balanceOf(trustFundAddress);
            con2bal = await trf2.balanceOf(trustFundAddress);
            assert.equal(ben1bal.toString(), tokens('1000'));
            assert.equal(ben2bal.toString(), tokens('1000'));
            assert.equal(con1bal.toString(), tokens('0'));
            assert.equal(con2bal.toString(), tokens('0'));

            let assetLength = await trustFund.getNumberOfAssets();
            assert.equal(2, assetLength.toString());
        })


    })

    


});
