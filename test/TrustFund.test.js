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

    describe("ERC20 tokens", async() => {
        let trf1, trf2, trf1Addr, trf2Addr

        before(async() => {
            trf1 = await TrustFundToken1.deployed();
            trf2 = await TrustFundToken2.deployed();
            trf1Addr = trf1.address;
            trf2Addr = trf2.address;

            let result = await trf1.approve.sendTransaction(trustFundAddress, tokens('1000'), {from: benefactor});
            console.log("result", result.logs[0].args)

        })


        it("should return balance of benefactor", async() => {
            const val = await trf1.balanceOf(benefactor);
            const val2 = await trf2.balanceOf(benefactor);
            assert.equal(1000000000000000000000, val.toString());
            assert.equal(1000000000000000000000, val2.toString());
        });

        it("should send money", async() => {
            const val = await trustFund.depositERC20Asset.sendTransaction(trf1Addr, tokens('1000'), "lol" , {from: benefactor});
            const val2 = await trf2.balanceOf(trustFundAddress);
            assert.equal(1000000000000000000000, val2.toString());
        })
    })

});
