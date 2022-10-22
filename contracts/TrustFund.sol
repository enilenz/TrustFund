// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC1363.sol";
import "@openzeppelin/contracts/interfaces/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/// @title A contract that holds token for periods of time till withdrawal
/// @author Eniayo Odubawo

contract TrustFund{

    address payable private benefactor;
    address payable private spender;
    uint256 public lockDuration;

    IERC20 private ierc20;
    IERC721 private ierc721;

    // maps address of token to its struct
    mapping(address => Asset) assets;

    // map for if an asset exists in the contract
    mapping(address => bool) isAsset;

    // address of all available assets
    address[] allAssets;

    enum AssetType{
        Erc20,
        Erc721
    }

    struct Asset {
    string assetName;
    AssetType assetType;
    uint assetBalance;
    uint[] assetIds;
    address assetAddr;
      }

    error InsufficentCharactersForAssetName(string assetName);

    event LockDurationSet(uint indexed);
    event SpenderAddressChanged(address indexed);
    event BenefactorAndSpenderAddresses(address indexed);
    event AssetDeposited(
        string assetName,
        AssetType assetType,
        uint indexed balance,
        address indexed assetAddr
    );

    event AssetWithdrawn(
        string assetName,
        AssetType assetType,
        uint indexed balance,
        address indexed assetAddr
    );

    event AssetBalanceIsZero(
        string assetName,
        AssetType assetType,
        address indexed assetAddr
    );

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

    modifier nonZeroValue(uint _value) {
        require(_value > 0, "invalid value");
        _;
    }

    modifier onlyAsset(address assetAddr){
        require(isAsset[assetAddr], "asset not found");
        _;
    }

    constructor(address payable _benefactor, address payable _spender) payable {
        require(msg.value > 0, "deposit inital funds");

        benefactor = _benefactor;
        spender = _spender;
        setLockDuration();
    
    }

    /// @notice sets lock duration
    function setLockDuration() internal {
       lockDuration = block.timestamp +  52 weeks; 
       emit LockDurationSet(lockDuration);
    }

    function getLockTimeLeft() public view returns (uint256 timeLeft){
        timeLeft = lockDuration;
    }

    /// @notice deposits erc20 asset into contract
    /// @param _asset address of erc20 contract
    /// @param _value amount of tokens for deposit
    /// @param _assetName name of tokens in contract
    function depositERC20Asset(
        address _asset, uint _value, string calldata _assetName
        ) 
        external payable nonZeroValue(_value) returns(bool success)
    {
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
        uint[] memory a;

        assets[_asset] = Asset(_assetName, AssetType.Erc20, balance, a, _asset);

        success = IERC20(_asset).transferFrom(msg.sender, address(this), _value);

        emit AssetDeposited(_assetName, AssetType.Erc20, balance, _asset);

    }

    /// @notice deposits erc721 asset into contract
    /// @param _asset address of erc721 contract
    /// @param assetId id of token
    /// @param _assetName name of tokens in contract
    function depositERC721Asset(address _asset, uint assetId, string calldata _assetName) external payable {
        Asset storage asset = assets[_asset];

        if(bytes(_assetName).length < 3){
            revert InsufficentCharactersForAssetName(_assetName); 
        }

        if(!isAsset[_asset]){
            isAsset[_asset] = true;
            allAssets.push(_asset);
            asset.assetName = _assetName;
            asset.assetType = AssetType.Erc721;
            asset.assetBalance = 0;
            asset.assetIds.push(assetId);
            asset.assetAddr = _asset;

        }else if(isAsset[_asset]){

            asset.assetIds.push(assetId);

        }

        IERC721(_asset).safeTransferFrom(msg.sender, address(this), assetId);

        emit AssetDeposited(_assetName, AssetType.Erc721, assetId, _asset);

    }

    /// @notice returns balance of erc20 asset 
    /// @param assetAddr address of erc20 contract
    function checkBalance(address assetAddr) external payable onlyAsset(assetAddr) returns(uint balance){
        balance = assets[assetAddr].assetBalance;
    }

    /// @notice withdraws erc20 asset from contract
    /// @param assetAddr address of erc20 contract
    /// @param value amount of tokens to withdraw 
    function withdrawERC20Asset(
        address assetAddr, uint value
        ) 
        public payable onlyBenefactorOrSpender onlyAsset(assetAddr) returns(bool success ) 
    { 
        Asset storage asset = assets[assetAddr];
        uint balance;
        require(asset.assetBalance >= value, "insufficent funds");

        asset.assetBalance -= value;
        balance = asset.assetBalance;
        if(balance == 0){
            for(uint i = 0; i < allAssets.length; i++){
                if(allAssets[i] == assetAddr){
                    remove(i);
                    break;
                }
            }
            
            isAsset[assetAddr] = false;
            emit AssetBalanceIsZero(asset.assetName, asset.assetType, assetAddr);
        }    

        success = IERC20(assetAddr).transfer(msg.sender, value);

        emit AssetWithdrawn(asset.assetName, asset.assetType, balance, asset.assetAddr);
    }

    /// @notice withdrae erc721 asset from contract
    /// @param addr address of erc721 contract
    /// @param id id of token to withdraw
    function withdrawERC721Asset(address addr, uint id) public payable onlyBenefactorOrSpender returns(bool p ) {
        Asset storage asset = assets[addr];
        bool idFound;
        for(uint i = 0; i < asset.assetIds.length; i++){
            if(id == asset.assetIds[i]){
               idFound = true;
               IERC721(addr).safeTransferFrom(address(this), msg.sender, id);
               asset.assetIds[i] = asset.assetIds[asset.assetIds.length - 1];
               asset.assetIds.pop();

               if(asset.assetIds.length == 0){
                  isAsset[addr] = false;
                  remove(i);

                  emit AssetBalanceIsZero(asset.assetName, asset.assetType, asset.assetAddr);
               }

               emit AssetWithdrawn(asset.assetName, asset.assetType, id, asset.assetAddr);
            }
        }

        require(idFound == true, "id not found");
        p = true;
    }

    /// @notice withdraws all erc20 tokens from contract
    function withdrawAllERC20Assets() public payable onlyBenefactorOrSpender returns (uint n) {
        address[] memory allAddresses = getAssetAddresses();

        for(uint i = 0; i < allAssets.length; i++){
            if(assets[allAddresses[i]].assetType == AssetType.Erc20 ){
                withdrawERC20Asset(allAddresses[i], assets[allAddresses[i]].assetBalance);
                n++;
            }
        }
    }

    /// @notice returns information of assets if in contract
    /// @param addr address of erc721 contract
    function getAssetInformation(address addr) external view returns(string memory name, AssetType _assesttype, uint _balance, uint[] memory ids, address add){
        if(!isAsset[addr]){
            revert("asset not in contract");
        }

        Asset memory asset = assets[addr];
        name = asset.assetName;
        _assesttype = asset.assetType;
        _balance = asset.assetBalance;
        ids = asset.assetIds;
        add = asset.assetAddr;         
    }

    /// @notice returns addresses of all tokens in contract
    function getAssetAddresses() public view returns(address[] memory ){
        address[] memory a = new address[](allAssets.length);

        for(uint i = 0; i < allAssets.length; i++){
            a[i] = allAssets[i];
        }

        return a;
    
    }

    /// @notice checks if an asset is stored in the contract
    function checkAssetIsInContract(address addr) external view returns(bool){
        return isAsset[addr];
    }

    /// @notice returns number of assets in contract
    function getNumberOfAssets() public view returns(uint _number) {
        _number = allAssets.length;
    }

    function getBenefactor() external view returns(address _benefactor){
        _benefactor = benefactor;
    }

    function getSpender() external view returns(address _spender){
        _spender = spender;
    }

    /// @notice changes spender address, can only be called by benefactor
    /// @param s new spender address
    function setSpender(address payable s) external onlyBenefactor {
        require(s != address(0), "invalid address");
        require(s != benefactor, "benefactor cannot be spender");

        spender = s;
        emit SpenderAddressChanged(spender);
    }

    /// @notice removes an asset from the array which stores them all
    function remove(uint i) internal {
        allAssets[i] = allAssets[allAssets.length - 1];
        allAssets.pop();
    }

    /// @notice fucntion implemeted to receive and send erc721 tokens, in order to avoid lost(burnt) tokens
    function onERC721Received(
    ) external pure returns (bytes4){
        return this.onERC721Received.selector;
    }
    
}