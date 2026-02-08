
const { ethers } = require("hardhat");

const PROVENANCE_REGISTRY_ADDRESS = "0xF015b52C9739Dc8D0739e7f7700eC7bbaE9B77C7";
const ARTIFACT_REGISTRY_V1 = "0xD76546043E4d9bb7fA3Bd73533A02c82aE4be2f8";
const DIGITAL_OBJECT_NFT = "0x87020198e7595C60b200EA80be41548F44573365";
const START_BLOCK = 25900000;
const CHUNK_SIZE = 9000;

const PROVENANCE_REGISTRY_ABI = [
    "event Derived(address indexed nft, uint256 indexed parentId, uint256 indexed childId, address actor, bytes32 ref)",
    "event Attested(address indexed nft, uint256 indexed tokenId, address indexed attester, uint8 kind, bytes32 ref, bytes32 payloadHash)"
];

async function fetchEventsInChunks(contract, filter, startBlock, endBlock) {
    let events = [];
    let currentBlock = startBlock;

    // Create an interface to decode logs since we might get raw logs if using provider directly, 
    // but contract.queryFilter should handle it.
    // However, queryFilter with range might fail if range > 10000.

    while (currentBlock <= endBlock) {
        const toBlock = Math.min(currentBlock + CHUNK_SIZE, endBlock);
        // console.log(`Querying ${currentBlock} to ${toBlock}...`);

        try {
            const chunk = await contract.queryFilter(filter, currentBlock, toBlock);
            events = events.concat(chunk);
        } catch (e) {
            console.error(`Error fetching chunk ${currentBlock}-${toBlock}:`, e.message);
        }

        currentBlock += CHUNK_SIZE + 1;
    }
    return events;
}

async function main() {
    const [deployer] = await ethers.getSigners();
    const currentBlock = await ethers.provider.getBlockNumber();
    console.log(`Current Block: ${currentBlock}`);
    console.log(`Start Block: ${START_BLOCK}`);

    if (START_BLOCK > currentBlock) {
        console.log("Start block is in the future. Checking from current block - 10000");
    }

    const registry = new ethers.Contract(PROVENANCE_REGISTRY_ADDRESS, PROVENANCE_REGISTRY_ABI, deployer);

    // Check ArtifactRegistryV1
    console.log(`\nChecking events for NFT: ${ARTIFACT_REGISTRY_V1} (ArtifactRegistryV1)`);
    const derivedFilterV1 = registry.filters.Derived(ARTIFACT_REGISTRY_V1);
    const attestedFilterV1 = registry.filters.Attested(ARTIFACT_REGISTRY_V1);

    const derivedEventsV1 = await fetchEventsInChunks(registry, derivedFilterV1, START_BLOCK, currentBlock);
    const attestedEventsV1 = await fetchEventsInChunks(registry, attestedFilterV1, START_BLOCK, currentBlock);
    console.log(`Derived events: ${derivedEventsV1.length}`);
    console.log(`Attested events: ${attestedEventsV1.length}`);

    // Check DigitalObjectNFT
    console.log(`\nChecking events for NFT: ${DIGITAL_OBJECT_NFT} (DigitalObjectNFT)`);
    const derivedFilterDO = registry.filters.Derived(DIGITAL_OBJECT_NFT);
    const attestedFilterDO = registry.filters.Attested(DIGITAL_OBJECT_NFT);

    const derivedEventsDO = await fetchEventsInChunks(registry, derivedFilterDO, START_BLOCK, currentBlock);
    const attestedEventsDO = await fetchEventsInChunks(registry, attestedFilterDO, START_BLOCK, currentBlock);
    console.log(`Derived events: ${derivedEventsDO.length}`);
    console.log(`Attested events: ${attestedEventsDO.length}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
