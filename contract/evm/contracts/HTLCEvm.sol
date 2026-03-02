// contracts/evm/contracts/HTLCEvm.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract HTLCEvm is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct LockEntry {
        address sender;
        address receiver;
        address token;
        uint256 amount;
        bytes32 hashlock; // sha256 of secret
        uint256 timelock; // unix timestamp
        bool withdrawn;
        bool refunded;
    }

    mapping(bytes32 => LockEntry) public locks;

    event Locked(
        bytes32 indexed lockId,
        address indexed sender,
        address indexed receiver,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock,
        address token
    );
    event Withdrawn(bytes32 indexed lockId, bytes32 preimage);
    event Refunded(bytes32 indexed lockId);

    error LockNotFound();
    error InvalidPreimage();
    error LockExpired();
    error AlreadyWithdrawn();
    error AlreadyRefunded();
    error NotYetExpired();

    function lock(
        address receiver,
        address token,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock
    ) external nonReentrant returns (bytes32 lockId) {
        require(amount > 0, "amount must be positive");
        require(timelock > block.timestamp, "timelock must be future");

        lockId = keccak256(
            abi.encodePacked(
                msg.sender,
                receiver,
                token,
                amount,
                hashlock,
                timelock,
                block.timestamp
            )
        );

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        locks[lockId] = LockEntry({
            sender: msg.sender,
            receiver: receiver,
            token: token,
            amount: amount,
            hashlock: hashlock,
            timelock: timelock,
            withdrawn: false,
            refunded: false
        });

        emit Locked(
            lockId,
            msg.sender,
            receiver,
            amount,
            hashlock,
            timelock,
            token
        );
    }

    function withdraw(
        bytes32 lockId,
        bytes32 preimage
    ) external nonReentrant returns (bool) {
        LockEntry storage entry = locks[lockId];
        if (entry.sender == address(0)) revert LockNotFound();
        if (entry.withdrawn) revert AlreadyWithdrawn();
        if (entry.refunded) revert AlreadyRefunded();
        if (sha256(abi.encodePacked(preimage)) != entry.hashlock)
            revert InvalidPreimage();
        if (block.timestamp >= entry.timelock) revert LockExpired();

        entry.withdrawn = true;
        IERC20(entry.token).safeTransfer(entry.receiver, entry.amount);
        emit Withdrawn(lockId, preimage);
        return true;
    }

    function refund(bytes32 lockId) external nonReentrant returns (bool) {
        LockEntry storage entry = locks[lockId];
        if (entry.sender == address(0)) revert LockNotFound();
        if (entry.withdrawn) revert AlreadyWithdrawn();
        if (entry.refunded) revert AlreadyRefunded();
        if (block.timestamp < entry.timelock) revert NotYetExpired();

        entry.refunded = true;
        IERC20(entry.token).safeTransfer(entry.sender, entry.amount);
        emit Refunded(lockId);
        return true;
    }
}
