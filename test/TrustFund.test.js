const TrustFund = artifacts.require("TrustFund");
const TrustFundToken1 = artifacts.require("TrustFundToken1");
const TrustFundToken2 = artifacts.require("TrustFundToken2");

function tokens(n){
    return web3.utils.toWei(n, 'ether');
}

//1000000000000000000000

contract("TrustFund", async(accounts) => {
    let trustFund, trustFundAddress, benefactor, spender;

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
        let trf1, trf2, trf1Addr, trf2Addr, approvalResult1, approvalResult2

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

            let withdrawalResult1 = await trustFund.withdrawERC20Asset(trf1Addr, tokens('100'), {from: benefactor});

            const truthVal1 = await trustFund.checkAssetIsInContract(trf1Addr);
            assert.isFalse(truthVal1);

            assetNumber = await trustFund.getNumberOfAssets({from: benefactor});
            assert.equal(1, assetNumber.toString());

            ben1bal = await trf1.balanceOf(benefactor);
            assert.equal(ben1bal.toString(), tokens('1000'));

        })
    })

});
