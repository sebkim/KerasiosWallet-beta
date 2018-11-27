pragma solidity ^0.4.24;
import "./MasterRole.sol";

contract AddressMapper is MasterRole {
    
    event DoMap(address indexed src, bytes32 indexed target, string rawTarget);
    event DoMapAuto(address indexed src, bytes32 indexed target, string rawTarget);
    event UnMap(address indexed src);

    mapping (address => string) public mapper;

    modifier onlyNotSet(address src) {
        bytes memory tmpTargetBytes = bytes(mapper[src]);
        require(tmpTargetBytes.length == 0);
        _;
    }

    function()
        public
        payable
        onlyNotSet(msg.sender)
    {
        require(msg.value > 0);
        _doMapAuto(msg.sender, string(msg.data));
        msg.sender.transfer(msg.value);
    }

    function isAddressSet(address thisAddr)
        public
        view
        returns(bool)
    {
        bytes memory tmpTargetBytes = bytes(mapper[thisAddr]);
        if(tmpTargetBytes.length == 0) {
            return false;
        } else {
            return true;
        }
    }

    function _doMapAuto(address src, string target)
        internal
    {
        mapper[src] = target;
        bytes32 translated = _stringToBytes32(target);
        emit DoMapAuto(src, translated, target);
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

    function submitTransaction(address destination, uint value, bytes data)
        public
        onlyMaster
    {
        external_call(destination, value, data.length, data);
    }

    function external_call(address destination, uint value, uint dataLength, bytes data) private returns (bool) {
        bool result;
        assembly {
            let x := mload(0x40)   // "Allocate" memory for output (0x40 is where "free memory" pointer is stored by convention)
            let d := add(data, 32) // First 32 bytes are the padded length of data, so exclude that
            result := call(
                sub(gas, 34710),   // 34710 is the value that solidity is currently emitting
                                   // It includes callGas (700) + callVeryLow (3, to pay for SUB) + callValueTransferGas (9000) +
                                   // callNewAccountGas (25000, in case the destination address does not exist and needs creating)
                destination,
                value,
                d,
                dataLength,        // Size of the input (in bytes) - this is what fixes the padding problem
                x,
                0                  // Output is ignored, therefore the output size is zero
            )
        }
        return result;
    }
}