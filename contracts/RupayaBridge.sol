// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract RupayaBridge is Pausable, Ownable, ReentrancyGuard {
    mapping(address => uint256) public lockedTokens;
    uint256 public totalLocked;

    event TokensLocked(address indexed user, uint256 amount, uint256 timestamp);
    event TokensUnlocked(address indexed user, uint256 amount, uint256 timestamp);
    event AdminWithdraw(address indexed admin, uint256 amount, uint256 timestamp);
    event EmergencyWithdraw(address indexed user, uint256 amount, uint256 timestamp);

    modifier nonZeroAmount(uint256 amount) {
        require(amount > 0, "Amount must be greater than zero");
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {
        // The Ownable constructor automatically sets the deployer as the initial owner
    }

    receive() external payable {
        lockTokens();
    }

    function lockTokens() public payable nonZeroAmount(msg.value) whenNotPaused nonReentrant {
        lockedTokens[msg.sender] += msg.value;
        totalLocked += msg.value;

        emit TokensLocked(msg.sender, msg.value, block.timestamp);
    }

    function unlockTokens(address payable user, uint256 amount) external onlyOwner nonZeroAmount(amount) nonReentrant {
        require(lockedTokens[user] >= amount, "Insufficient locked tokens");

        lockedTokens[user] -= amount;
        totalLocked -= amount;
        user.transfer(amount);

        emit TokensUnlocked(user, amount, block.timestamp);
    }

    function withdraw(uint256 amount) external onlyOwner nonZeroAmount(amount) nonReentrant {
        require(address(this).balance >= amount, "Insufficient contract balance");

        payable(owner()).transfer(amount);

        emit AdminWithdraw(owner(), amount, block.timestamp);
    }

    function emergencyWithdraw() external nonReentrant whenPaused {
        uint256 amount = lockedTokens[msg.sender];
        require(amount > 0, "No tokens to withdraw");

        lockedTokens[msg.sender] = 0;
        totalLocked -= amount;
        payable(msg.sender).transfer(amount);

        emit EmergencyWithdraw(msg.sender, amount, block.timestamp);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
