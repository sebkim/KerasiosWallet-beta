pragma solidity ^0.4.24;

import "./ERC20Mintable.sol";

/**
 * @title Capped token
 * @dev Mintable token with a token cap.
 */
contract ERC20Capped is ERC20Mintable {

  event SetIsPreventedAddr(address indexed preventedAddr, bool hbool);

  uint256 private _cap;
  string private _name;
  string private _symbol;
  uint8 private _decimals;

  mapping ( address => bool ) public isPreventedAddr;

  function transfer(address to, uint256 value) public returns (bool) {
    _checkedTransfer(msg.sender, to, value);
    return true;
  }

  function transferWithData(address to, uint256 value, bytes32 data) public returns (bool) {
    _checkedTransfer(msg.sender, to, value);
    emit TransferWithData(msg.sender, to, data, value);
    return true;
  }

  function transferFrom(
    address from,
    address to,
    uint256 value
  )
    public
    returns (bool)
  {
    require(value <= _allowed[from][msg.sender]);

    _allowed[from][msg.sender] = _allowed[from][msg.sender].sub(value);
    _checkedTransfer(from, to, value);
    return true;
  }

  function transferFromWithData(
    address from,
    address to,
    uint256 value,
    bytes32 data
  )
    public
    returns (bool)
  {
    require(value <= _allowed[from][msg.sender]);

    _allowed[from][msg.sender] = _allowed[from][msg.sender].sub(value);
    _checkedTransfer(from, to, value);
    emit TransferWithData(from, to, data, value);
    return true;
  }

  function _checkedTransfer(address from, address to, uint256 value) internal {
    require(value <= _balances[from]);
    require(to != address(0));

    
    if(isPreventedAddr[to]) {
      require(addressMapper.isAddressSet(from));
    }

    _balances[from] = _balances[from].sub(value);
    _balances[to] = _balances[to].add(value);
    emit Transfer(from, to, value);
  }

  function setIsPreventedAddr(address thisAddr, bool hbool)
    public
    onlyMinter
  {
    isPreventedAddr[thisAddr] = hbool;
    emit SetIsPreventedAddr(thisAddr, hbool);
  }

  constructor(address addressMapperAddr, uint256 cap, string name, string symbol, uint8 decimals)
    ERC20Mintable(addressMapperAddr)
    public
  {
    require(cap > 0);
    _cap = cap;
    _name = name;
    _symbol = symbol;
    _decimals = decimals;

  }

  /**
   * @return the cap for the token minting.
   */
  function cap() public view returns(uint256) {
    return _cap;
  }

  function _mint(address account, uint256 value) internal {
    require(totalSupply().add(value) <= _cap);
    super._mint(account, value);
  }

  /**
   * @return the name of the token.
   */
  function name() public view returns(string) {
    return _name;
  }

  /**
   * @return the symbol of the token.
   */
  function symbol() public view returns(string) {
    return _symbol;
  }

  /**
   * @return the number of decimals of the token.
   */
  function decimals() public view returns(uint8) {
    return _decimals;
  }
  
}
