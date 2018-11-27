pragma solidity ^0.4.24;
import "./MasterRole.sol";
import "./AddressMapper.sol";

contract KerasiosWallet is MasterRole {

    event Deposit(address indexed sender, uint value);
    event Withdraw(address indexed receiver, uint value);
    
    AddressMapper public addressMapper;
    
    constructor(address addressMapperAddr)
        public
    {
        addressMapper = AddressMapper(addressMapperAddr);
    }

    function()
        public
        payable
    {
        require(addressMapper.isAddressSet(msg.sender));
        if (msg.value > 0)
            emit Deposit(msg.sender, msg.value);

    }

    function submitTransaction(address destination, uint value, bytes data)
        public
        onlyMaster
    {
        external_call(destination, value, data.length, data);
        if(value > 0)
            emit Withdraw(destination, value);
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