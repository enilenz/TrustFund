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
        string assetName,
        string indexed assetType,
        uint indexed balance,
        address indexed assetAddr
    );

    event AssetWithdrawn(
        string assetName,
        string indexed assetType,
        uint indexed balance,
        address indexed assetAddr
    );

    event AssetBalanceIsZero(
        string assetName,
        string indexed assetType,
        address indexed assetAddr
    );

    // struct Asset{
    //     string assetName;
    //     string assetType;
    //     uint assetBalance;
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

    modifier onlyBenefactorOrSpender() {
        require(msg.sender == benefactor || msg.sender == spender);
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

        assets[_asset] = Asset(_assetName, "erc20", balance,  _asset);

        r = IERC20(_asset).transferFrom(msg.sender, address(this), _value);

        emit AssetDeposited(_assetName,"erc20", balance, _asset);

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
        address assetAddr;
    }

    function checkBalance(address assetAddr) external payable returns(uint s){
        require(isAsset[assetAddr], "asset not found");
        Asset memory a = assets[assetAddr];
        s = a.assetBalance;
    }

    function withdrawERC20Asset(address assetAddr, uint value) external payable onlyBenefactorOrSpender returns(bool p ) { 
        Asset storage asset = assets[assetAddr];
        uint balance;
        require(asset.assetBalance >= value, "insufficent funds");
        require(isAsset[assetAddr], "asset not found");
        require(value > 0, "insufficent value sent");

        asset.assetBalance -= value;
        balance = asset.assetBalance;
        if(balance == 0){
            for(uint i = 0; i < allAssets.length; i++){
                if(allAssets[i] == assetAddr){
                    allAssets[i] = allAssets[allAssets.length - 1];
                    allAssets.pop();
                    //delete allAssets[i];
                    break;
                }
            }
            
            isAsset[assetAddr] = false;
            emit AssetBalanceIsZero(asset.assetName, asset.assetType, assetAddr);
        }    

        p = IERC20(assetAddr).transfer(msg.sender, value);

        emit AssetWithdrawn(asset.assetType, asset.assetName, balance, asset.assetAddr);
    }

    function withdrawERC721Asset(address addr, uint id) external payable onlyBenefactorOrSpender returns(bool p ) { p = true;}

    function withdrawERC1155Asset(address addr, uint value, uint id) external payable onlyBenefactorOrSpender returns(bool p ) { p = true;}

    function withdrawAllERC20Assets() external payable onlyBenefactorOrSpender {}

    function withdrawAllERC721Assets() external payable onlyBenefactorOrSpender {}

    function withdrawAllERC1155Assets() external payable onlyBenefactorOrSpender {}

    function withdrawAllAssets() external payable onlyBenefactorOrSpender {}

    function getAssetInformation(address addr) external view returns(string memory s, string memory t, uint b, address add){
        assert(isAsset[addr]);
        Asset memory asset = assets[addr];
        s = asset.assetName;
        t = asset.assetType;
        b = asset.assetBalance;
        add = asset.assetAddr;         
    }

    function getAssetAddresses() external payable returns(address[] memory ){
        address[] memory a = new address[](allAssets.length);

        for(uint i = 0; i < allAssets.length; i++){
            a[i] = allAssets[i];
        }

        return a;
    
    }

    function checkAssetIsInContract(address addr) external view returns(bool){
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

    function remove(uint i) internal {
        allAssets[i] = allAssets[allAssets.length - 1];
        allAssets.pop();
    }
    
}