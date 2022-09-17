const TrustFund = artifacts.require("TrustFund");

contract("TrustFund", async(accounts) => {
    let trustFund, benefactor, spender;

    before(async() => {
         trustFund = await TrustFund.deployed();
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
    });

});
