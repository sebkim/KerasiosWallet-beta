pragma solidity ^0.4.24;

import "./Roles.sol";

contract MasterRole {
  using Roles for Roles.Role;

  event MasterAdded(address indexed account);
  event MasterRemoved(address indexed account);

  Roles.Role private masters;

  constructor() internal {
    _addMaster(msg.sender);
  }

  modifier onlyMaster() {
    require(isMaster(msg.sender));
    _;
  }

  function isMaster(address account) public view returns (bool) {
    return masters.has(account);
  }

  function addMaster(address account) public onlyMaster {
    _addMaster(account);
  }

  function renounceMaster() public {
    _removeMaster(msg.sender);
  }

  function _addMaster(address account) internal {
    masters.add(account);
    emit MasterAdded(account);
  }

  function _removeMaster(address account) internal {
    masters.remove(account);
    emit MasterRemoved(account);
  }
}
