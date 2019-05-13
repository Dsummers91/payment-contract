pragma solidity ^0.5.0;

import "./IERC20.sol";
import "./math/SafeMath.sol";

contract Multisend {
  using SafeMath for uint256;

  address payable private _owner;
  uint private _fee;
  mapping(address => mapping(address => uint256)) public balances;

  constructor(uint256 initialFee) public {
    _owner = msg.sender;
    _fee = initialFee;
  }

  function deposit(address[] calldata tokenDepositAddress, uint256[] calldata tokenDepositAmount) external payable {
    require(tokenDepositAddress.length == tokenDepositAmount.length);
    balances[msg.sender][address(0)] = balances[msg.sender][address(0)].add(msg.value);
    for (uint i=0;i<tokenDepositAddress.length;i++) {
      IERC20(tokenDepositAddress[i]).transferFrom(msg.sender, address(this), tokenDepositAmount[i]);
      balances[msg.sender][tokenDepositAddress[i]] = balances[msg.sender][tokenDepositAddress[i]].add(tokenDepositAmount[i]);
    }
  }

  function sendPayment(address[] calldata tokens, address payable[] calldata recipients, uint256[] calldata amounts) external payable returns (bool) {
    require(tokens.length == recipients.length);
    require(tokens.length == amounts.length);
    uint256 total_ether_amount = 0;
    for (uint i=0; i < recipients.length; i++) {
      if(tokens[i] != address(0)) {
        IERC20(tokens[i]).transfer(recipients[i], amounts[i]);
        balances[msg.sender][tokens[i]] = balances[msg.sender][tokens[i]].sub(amounts[i]);
      }
      else {
        recipients[i].transfer(amounts[i]);
        total_ether_amount = total_ether_amount.add(amounts[i]);
        balances[msg.sender][address(0)] = balances[msg.sender][address(0)].sub(amounts[i]);
      }
    }
    require(total_ether_amount == msg.value);
  }

  function depositAndSendPayment(address[] calldata tokenDepositAddress, uint256[] calldata tokenDepositAmount, address[] calldata tokens, address payable[] calldata recipients, uint256[] calldata amounts) external payable returns (bool) {
      this.deposit(tokenDepositAddress, tokenDepositAmount);
  }

  function withdrawTokens(address payable[] calldata tokenAddresses) external {
    for(uint i=0; i<tokenAddresses.length;i++) {
      IERC20 ERC20 = IERC20(tokenAddresses[i]);
      uint256 balance = ERC20.balanceOf(address(this));
      ERC20.transfer(_owner, balance);
    }
  }

  function withdrawEther() external onlyOwner {
    _owner.transfer(address(this).balance);
  }

  function owner() external view returns (address) {
    return _owner;
  }

  function transferOwnership(address payable newOwner) external onlyOwner {
    require(newOwner != address(0), "Owner address may not be set to zero address");
    _owner = newOwner;
  }

  modifier onlyOwner {
    require(msg.sender == _owner, "Sender is not owner of the contract");
    _;
  }
}
