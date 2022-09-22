// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TrustFundToken1 is ERC20{

    constructor(address b) ERC20("TrustFund Token 1", "TRF1") {
        _mint(b, 1000 * 10 ** decimals());
    }
}