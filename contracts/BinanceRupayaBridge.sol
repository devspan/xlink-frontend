// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BinanceRupayaBridge is ERC20, ERC20Burnable, Pausable, ReentrancyGuard, Ownable {
    event TokensMinted(address indexed user, uint256 amount, uint256 timestamp);
    event TokensBurned(address indexed user, uint256 amount, uint256 timestamp);
    event ContractPaused(address indexed admin, uint256 timestamp);
    event ContractUnpaused(address indexed admin, uint256 timestamp);
    event RateLimitUpdated(uint256 newInterval, uint256 newMaxMintAmount, uint256 newMaxBurnAmount);

    constructor(address admin) ERC20("Bridged Rupaya", "BRUPX") Ownable(admin) {}

    modifier onlyAdmin() {
        require(msg.sender == owner(), "Caller is not the admin");
        _;
    }

    function mintTokens(address user, uint256 amount) 
        external 
        onlyAdmin 
        whenNotPaused 
        nonReentrant 
    {
        require(user != address(0), "Mint to the zero address");
        require(amount > 0, "Mint amount must be greater than zero");

        _mint(user, amount);
        emit TokensMinted(user, amount, block.timestamp);
    }

    function burnTokens(address user, uint256 amount) 
        external 
        onlyAdmin 
        whenNotPaused 
        nonReentrant 
    {
        require(user != address(0), "Burn from the zero address");
        require(amount > 0, "Burn amount must be greater than zero");
        require(balanceOf(user) >= amount, "Burn amount exceeds balance");

        _burn(user, amount);
        emit TokensBurned(user, amount, block.timestamp);
    }

    function pause() external onlyAdmin {
        _pause();
        emit ContractPaused(msg.sender, block.timestamp);
    }

    function unpause() external onlyAdmin {
        _unpause();
        emit ContractUnpaused(msg.sender, block.timestamp);
    }
}
