// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IUsagePolicy.sol";
import "../ArtifactRegistryV1.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PayableUsagePolicy
 * @notice Simple policy: Fixed fees for Derivation and Consumption.
 * @dev Revenue is sent to the Artifact Publisher (fetched from Registry).
 */
contract PayableUsagePolicyV1 is IUsagePolicy, Ownable {
    ArtifactRegistryV1 public registry;

    mapping(uint256 => uint256) public derivationFees;
    mapping(uint256 => uint256) public consumptionFees;

    // Platform fee config (simple flat fee or %) - omitted for MVP, 100% to publisher
    
    event FeesUpdated(uint256 indexed artifactId, uint256 deriveFee, uint256 consumeFee);
    event RevenueDistributed(uint256 indexed artifactId, address indexed recipient, uint256 amount);

    /// @notice Policy version
    uint8 public constant VERSION = 1;

    constructor(address _registry) Ownable(msg.sender) {
        registry = ArtifactRegistryV1(_registry);
    }

    /**
     * @notice Set fees for a specific artifact. Only callable by the Artifact Publisher.
     */
    function setFees(uint256 artifactId, uint256 deriveFee, uint256 consumeFee) external {
        ArtifactRegistryV1.Artifact memory art = registry.getArtifact(artifactId);
        require(art.publisher == msg.sender, "Only publisher can set fees");
        
        derivationFees[artifactId] = deriveFee;
        consumptionFees[artifactId] = consumeFee;
        
        emit FeesUpdated(artifactId, deriveFee, consumeFee);
    }

    /**
     * @inheritdoc IUsagePolicy
     */
    function checkPermission(
        uint256 artifactId,
        address /* actor */,
        InteractionType interaction,
        bytes calldata /* context */
    ) external view override returns (uint256 feeAmount, bool isValid) {
        if (interaction == InteractionType.DERIVE) {
            return (derivationFees[artifactId], true);
        } else if (interaction == InteractionType.CONSUME) {
            return (consumptionFees[artifactId], true);
        }
        return (0, false);
    }

    /**
     * @inheritdoc IUsagePolicy
     */
    function onPaymentReceived(
        uint256 artifactId,
        address /* payer */,
        uint256 amount,
        InteractionType /* interaction */
    ) external payable override {
        // Simple Logic: Forward 100% to Publisher
        ArtifactRegistryV1.Artifact memory art = registry.getArtifact(artifactId);
        address payable recipient = payable(art.publisher);
        
        require(recipient != address(0), "Invalid recipient");

        (bool sent, ) = recipient.call{value: amount}("");
        require(sent, "Failed to send Ether");

        emit RevenueDistributed(artifactId, recipient, amount);
    }
}
