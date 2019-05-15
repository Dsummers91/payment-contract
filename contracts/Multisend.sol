pragma solidity ^0.5.0;

import "./IERC20.sol";
import "./math/SafeMath.sol";

contract Multisend {
  using SafeMath for uint256;

  address payable private _owner;
  uint private _fee;
  mapping(address => mapping(address => uint256)) public balances;


  /**
  * @param initialFee amount of fees taken per transaction in basis points
  */
  constructor(uint256 initialFee) public {
    _owner = msg.sender;
    _fee = initialFee;
  }

  function deposit(address[] memory tokenDepositAddress, uint256[] memory tokenDepositAmount) public payable {
    require(tokenDepositAddress.length == tokenDepositAmount.length);
    if(msg.value != 0) {
      uint256 etherFee = msg.value.div(10000).mul(_fee);
      balances[msg.sender][address(0)] = balances[msg.sender][address(0)].add(msg.value.sub(etherFee));
      balances[address(this)][address(0)] = balances[address(this)][address(0)].add(etherFee);
    }
    for (uint i=0;i<tokenDepositAddress.length;i++) {
      uint256 tokenFee = tokenDepositAmount[i].div(10000).mul(_fee);
      IERC20(tokenDepositAddress[i]).transferFrom(msg.sender, address(this), tokenDepositAmount[i]);
      balances[msg.sender][tokenDepositAddress[i]] = balances[msg.sender][tokenDepositAddress[i]].add(tokenDepositAmount[i].sub(tokenFee));
      balances[address(this)][tokenDepositAddress[i]] = balances[address(this)][tokenDepositAddress[i]].add(tokenFee);
    }
  }

  function sendPayment(address[] memory tokens, address payable[] memory recipients, uint256[] memory amounts) public payable returns (bool) {
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
  }

  function depositAndSendPayment(address[] calldata tokenDepositAddress, uint256[] calldata tokenDepositAmount, address[] calldata tokens, address payable[] calldata recipients, uint256[] calldata amounts) external payable returns (bool) {
      deposit(tokenDepositAddress, tokenDepositAmount);
      sendPayment(tokens, recipients, amounts);
  }

  function withdrawTokens(address payable[] calldata tokenAddresses) external {
    for(uint i=0; i<tokenAddresses.length;i++) {
      IERC20 ERC20 = IERC20(tokenAddresses[i]);
      uint256 balance = ERC20.balanceOf(address(this));
      ERC20.transfer(_owner, balance);
    }
  }

  /*** CONSTANT METHODS **/
  function getBalance(address _owner, address _address) external view returns (uint256) {
    return balances[_owner][_address];
  }

  /*** OWNER METHODS **/
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
