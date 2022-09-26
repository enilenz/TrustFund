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
    uint256 public assetCount;

    IERC20 private ierc20;
    IERC721 private ierc721;
    IERC1155 private ierc1155;

    error InsufficentCharactersForAssetName(string assetName);

    event LockDurationSet(uint indexed);
    event SpenderAddressChanged(address indexed);
    event BenefactorAndSpenderAddresses(address indexed);
    event AssetDeposited(
        address indexed assetAddr,
        string indexed assetType,
        string assetName,
        uint id,
        uint indexed balance
    );

    // struct Asset{
    //     string assetName;
    //     string assetType;
    //     uint assetBalance;
    //     uint assetId;
    //     address assetAddr;
    // }

    enum AssetTypes{
        ERC20,
        ERC721,
        ERC1155
    }

    modifier onlyBenefactor() {
        require(msg.sender == benefactor);
        _;
    }

    constructor(address payable _benefactor, address payable _spender) payable {
        require(msg.value > 0, "deposit inital funds");
        assetCount++;

        benefactor = _benefactor;
        spender = _spender;
        setLockDuration();
    
    }

    function setLockDuration() internal {
       lockDuration = block.timestamp +  52 weeks; 
       emit LockDurationSet(lockDuration);
    }

    function depositETH() external payable returns(bool r) {
        require(msg.value > 0);

        //emit AssetDeposited();
    }

    function depositERC20Asset(address _asset, uint _value, string calldata _assetName) external payable returns(bool r) {
        require(_value > 0, "insufficent value sent");
        uint balance;

        if(bytes(_assetName).length < 3){
            revert InsufficentCharactersForAssetName(_assetName); 
        }

        if(!isAsset[_asset]){
            isAsset[_asset] = true;
            allAssets.push(_asset);
            balance = _value;
        } 

        if(isAsset[_asset]){
            balance = assets[_asset].assetBalance + _value;
        }

        assets[_asset] = Asset(_assetName, "erc20", balance, 0, _asset);

        r = IERC20(_asset).transferFrom(msg.sender, address(this), _value);

        emit AssetDeposited(_asset, "erc20", _assetName, 0, balance);

    }

    function depositERC721Asset(address asset, uint assetId) external payable returns(bool r) {
        IERC721(asset).safeTransferFrom(msg.sender, address(this), assetId);

        //emit AssetDeposited();
    }

    function depositERC1155Asset(address asset, uint256 id, uint256 value, bytes calldata data) external payable returns(bool r) {
        IERC1155(asset).safeTransferFrom(msg.sender, address(this), id, value, data);

        //emit AssetDeposited();
    }

    mapping(address => Asset) assets;
    mapping(address => bool) isAsset;
    address[] allAssets;

        struct Asset{
        string assetName;
        string assetType;
        uint assetBalance;
        uint assetId;
        address assetAddr;
    }

    function withdrawERC20Asset(address addr, uint value) external payable returns(bool p ) { 
        p = true;
    }

    function withdrawERC721Asset(address addr, uint id) external payable returns(bool p ) { p = true;}

    function withdrawERC1155Asset(address addr, uint value, uint id) external payable returns(bool p ) { p = true;}

    function withdrawAllERC20Assets() external payable {}

    function withdrawAllERC721Assets() external payable {}

    function withdrawAllERC1155Assets() external payable {}

    function withdrawAllAssets() external payable {}

    function getAssetInformation(address addr) external view returns(string memory s, string memory t, uint b, uint id, address add){
        assert(isAsset[addr]);
        Asset memory asset = assets[addr];
        s = asset.assetName;
        t = asset.assetType;
        b = asset.assetBalance;
        id = asset.assetId;
        add = asset.assetAddr;         
    }

    function checkAsset(address addr) external view returns(bool){
        return isAsset[addr];
    }

    function getNumberOfAssets() public view returns(uint n) {
        n = allAssets.length;
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