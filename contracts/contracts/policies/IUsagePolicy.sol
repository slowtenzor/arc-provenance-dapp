// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IUsagePolicy
 * @notice Interface for usage policies governing artifact interactions
 */
interface IUsagePolicy {
    /// @notice Types of interactions
    enum InteractionType {
        DERIVE,     // Creating a child artifact (fork)
        CONSUME     // Using without modifying (exec/include)
    }

    /**
     * @notice Calculate the fee and validation for an interaction
     * @param artifactId The ID of the artifact being accessed
     * @param actor The address initiating the interaction
     * @param interaction The type of interaction
     * @param context Additional data (e.g., intended usage scope)
     * @return feeAmount The required payment amount (in native token/USDC)
     * @return isValid Whether the interaction is permitted
     */
    function checkPermission(
        uint256 artifactId,
        address actor,
        InteractionType interaction,
        bytes calldata context
    ) external view returns (uint256 feeAmount, bool isValid);

    /**
     * @notice Hook called after payment to process distribution
     * @dev Only callable by the Registry
     * @param artifactId The ID of the artifact
     * @param payer The address that paid
     * @param amount The amount paid
     * @param interaction The interaction type
     */
    function onPaymentReceived(
        uint256 artifactId,
        address payer,
        uint256 amount,
        InteractionType interaction
    ) external payable;
}
