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

    IERC20 private ierc20;
    IERC721 private ierc721;
    IERC1155 private ierc1155;

    event LockDurationSet(uint indexed);
    event SpenderAddressChanged(address indexed);
    event BenefactorAndSpenderAddresses(address indexed);
    event AssetDeposited(
        address indexed assetAddr,
        string indexed assetType,
        string assetName,
        uint id,
        uint value
    );

    struct Asset{
        string assetName;
        string assetType;
        uint assetBalance;
        uint assetId;
        address assetAddr;
    }

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

    mapping(address => Asset) assets;

    //mapping(string => mapping(address => uint)) assets;

    function depositETH() external payable returns(bool r) {
        require(msg.value > 0);

        //emit AssetDeposited();
    }

    function depositERC20Asset(address asset, uint value, string calldata assetName) external payable returns(bool r) {
              
        r = IERC20(asset).transferFrom(msg.sender, address(this), value);

        //emit AssetDeposited();

    }

    function depositERC721Asset(address asset, uint assetId) external payable returns(bool r) {
        IERC721(asset).safeTransferFrom(msg.sender, address(this), assetId);

        //emit AssetDeposited();
    }

    function depositERC1155Asset(address asset, uint256 id, uint256 value, bytes calldata data) external payable returns(bool r) {
        IERC1155(asset).safeTransferFrom(msg.sender, address(this), id, value, data);

        //emit AssetDeposited();
    }

    function withdrawAsset(address addr, uint value, uint id) external payable returns(bool p ) { p = true;}

    function withdrawAsset(address addr, uint value) external payable returns(bool p ) { p = true;}

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