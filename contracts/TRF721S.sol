// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract TrustFundERC721Token2 is ERC721{

    constructor(address add) ERC721("TrustFund NFT 2", "TRF-NFT2") {
        _safeMint(add, 0);
        _safeMint(add, 1);
    }
}