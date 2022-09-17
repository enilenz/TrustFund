// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC1363.sol";
import "@openzeppelin/contracts/interfaces/IERC1155.sol";

contract TrustFund {

    address payable private benefactor;
    address payable private spender;
    uint256 public lockDuration;

    event LockDurationSet(uint indexed);
    event SpenderAddressChanged(address indexed);
    event BenefactorAndSpenderAddresses(address indexed);

    modifier onlyBenefactor() {
        require(msg.sender == benefactor);
        _;
    }

    constructor(address payable _benefactor, address payable _spender) payable {
        require(msg.value > 0, "deposit inital funds");
        benefactor = _benefactor;
        spender = _spender;
        setLockDuration();
    
    }

    function setLockDuration() internal {
       lockDuration = block.timestamp +  52 weeks; 
       emit LockDurationSet(lockDuration);
    }

    function getBenefactor() external view returns(address b){
        b = benefactor;
    }

    function getSpender() external view returns(address s){
        s = spender;
    }

    function setSpender(address payable s) external onlyBenefactor {
        require(s != address(0), "invalid address");
        require(s != benefactor, "benefactor cannot be spender");

        spender = s;
        emit SpenderAddressChanged(spender);
    }
    
}