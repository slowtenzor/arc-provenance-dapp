// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./policies/IUsagePolicy.sol";

/**
 * @title ArtifactRegistry
 * @notice Central registry for Software Artifacts, Lineage, and Policy Enforcement.
 * @dev Implements the Arc Artifact Protocol v0.1 logic.
 */
contract ArtifactRegistry is Ownable, ReentrancyGuard {
    struct Artifact {
        uint256 id;
        address publisher;
        bytes32 contentHash;    // Git SHA, IPFS CID, etc.
        uint256 parentId;       // 0 for Genesis
        address usagePolicy;    // Contract governing this artifact
        string metaURI;         // Off-chain metadata (JSON)
        uint256 timestamp;
    }

    // State
    uint256 private _nextId = 1;
    mapping(uint256 => Artifact) public artifacts;
    mapping(bytes32 => uint256) public contentHashToId;

    // Events
    event ArtifactPublished(
        uint256 indexed artifactId,
        address indexed publisher,
        uint256 indexed parentId,
        address usagePolicy,
        bytes32 contentHash
    );

    event Interaction(
        uint256 indexed artifactId,
        address indexed actor,
        IUsagePolicy.InteractionType interactionType,
        uint256 feePaid
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Publish a new Genesis Artifact (no parent)
     * @param contentHash Unique identifier of the content
     * @param usagePolicy Address of the policy contract
     * @param metaURI Metadata URI
     */
    function publish(
        bytes32 contentHash,
        address usagePolicy,
        string calldata metaURI
    ) external nonReentrant returns (uint256) {
        return _createArtifact(msg.sender, contentHash, 0, usagePolicy, metaURI);
    }

    /**
     * @notice Derive a new Artifact from an existing Parent (Fork)
     * @dev Enforces Parent's Policy and processes payment
     * @param parentId ID of the parent artifact
     * @param contentHash Unique identifier of the new content
     * @param usagePolicy Address of the policy for the new artifact
     * @param metaURI Metadata URI
     * @param policyContext Data passed to Parent's policy for validation
     */
    function derive(
        uint256 parentId,
        bytes32 contentHash,
        address usagePolicy,
        string calldata metaURI,
        bytes calldata policyContext
    ) external payable nonReentrant returns (uint256) {
        Artifact memory parent = artifacts[parentId];
        require(parent.id != 0, "Parent does not exist");

        // 1. Check Parent's Policy
        if (parent.usagePolicy != address(0)) {
            IUsagePolicy policy = IUsagePolicy(parent.usagePolicy);
            (uint256 requiredFee, bool allowed) = policy.checkPermission(
                parentId,
                msg.sender,
                IUsagePolicy.InteractionType.DERIVE,
                policyContext
            );
            
            require(allowed, "Derivation not allowed by policy");
            require(msg.value >= requiredFee, "Insufficient fee");

            // 2. Process Payment
            if (msg.value > 0) {
                policy.onPaymentReceived{value: msg.value}(
                    parentId,
                    msg.sender,
                    msg.value,
                    IUsagePolicy.InteractionType.DERIVE
                );
            }
        }

        // 3. Register Child
        uint256 newId = _createArtifact(msg.sender, contentHash, parentId, usagePolicy, metaURI);
        
        emit Interaction(parentId, msg.sender, IUsagePolicy.InteractionType.DERIVE, msg.value);
        return newId;
    }

    /**
     * @notice Record consumption/usage of an Artifact
     * @param artifactId ID of the artifact
     * @param policyContext Data passed to policy
     */
    function consume(
        uint256 artifactId,
        bytes calldata policyContext
    ) external payable nonReentrant {
        Artifact memory art = artifacts[artifactId];
        require(art.id != 0, "Artifact does not exist");

        if (art.usagePolicy != address(0)) {
            IUsagePolicy policy = IUsagePolicy(art.usagePolicy);
            (uint256 requiredFee, bool allowed) = policy.checkPermission(
                artifactId,
                msg.sender,
                IUsagePolicy.InteractionType.CONSUME,
                policyContext
            );

            require(allowed, "Consumption not allowed by policy");
            require(msg.value >= requiredFee, "Insufficient fee");

            if (msg.value > 0) {
                policy.onPaymentReceived{value: msg.value}(
                    artifactId,
                    msg.sender,
                    msg.value,
                    IUsagePolicy.InteractionType.CONSUME
                );
            }
        }

        emit Interaction(artifactId, msg.sender, IUsagePolicy.InteractionType.CONSUME, msg.value);
    }

    // Internal
    function _createArtifact(
        address publisher,
        bytes32 contentHash,
        uint256 parentId,
        address usagePolicy,
        string memory metaURI
    ) internal returns (uint256) {
        require(contentHashToId[contentHash] == 0, "Content hash already registered");

        uint256 id = _nextId++;
        
        artifacts[id] = Artifact({
            id: id,
            publisher: publisher,
            contentHash: contentHash,
            parentId: parentId,
            usagePolicy: usagePolicy,
            metaURI: metaURI,
            timestamp: block.timestamp
        });

        contentHashToId[contentHash] = id;

        emit ArtifactPublished(id, publisher, parentId, usagePolicy, contentHash);
        return id;
    }

    // Viewers
    function getArtifact(uint256 id) external view returns (Artifact memory) {
        return artifacts[id];
    }
}
