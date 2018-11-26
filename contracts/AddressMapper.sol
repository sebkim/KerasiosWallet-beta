pragma solidity ^0.4.24;

import "./MasterRole.sol";

contract AddressMapper is MasterRole {
    
    event DoMap(address indexed src, bytes32 indexed target, string rawTarget);
    event UnMap(address indexed src);

    mapping (address => string) public mapper;
    
    modifier onlyNotSet(address src) {
        bytes memory tmpTargetBytes = bytes(mapper[src]);
        require(tmpTargetBytes.length == 0);
        _;
    }

    function doMap(address src, string target) 
        public
        onlyMaster
        onlyNotSet(src)
    {
        mapper[src] = target;
        bytes32 translated = _stringToBytes32(target);
        emit DoMap(src, translated, target);
    }

    function unMap(address src) 
        public
        onlyMaster
    {
        mapper[src] = "";
        emit UnMap(src);
    }

    function _stringToBytes32(string memory source) internal returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }

        assembly {
            result := mload(add(source, 32))
        }
    }
}