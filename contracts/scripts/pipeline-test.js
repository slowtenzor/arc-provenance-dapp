const hre = require("hardhat");
const { ethers } = hre;

// Deployed contract addresses
const ARTIFACT_REGISTRY_ADDRESS = "0xD76546043E4d9bb7fA3Bd73533A02c82aE4be2f8";
const PAYABLE_USAGE_POLICY_ADDRESS = "0x103944642c5Cc62BbF80d967c690f3EADac2b47e";

async function main() {
  console.log("🚀 Starting Pipeline Test (using deployed contracts)...");

  // Get signers
  const [owner, creator, user] = await ethers.getSigners();
  console.log("Testing with accounts:");
  console.log("  Owner:  ", owner.address);
  console.log("  Creator:", creator.address);
  console.log("  User:   ", user.address);

  // Connect to deployed contracts
  console.log("\n--- Connecting to Deployed Contracts ---");
  const registry = await ethers.getContractAt("ArtifactRegistryV1", ARTIFACT_REGISTRY_ADDRESS);
  const policy = await ethers.getContractAt("PayableUsagePolicyV1", PAYABLE_USAGE_POLICY_ADDRESS);
  console.log("✅ ArtifactRegistryV1:", ARTIFACT_REGISTRY_ADDRESS);
  console.log("✅ PayableUsagePolicyV1:", PAYABLE_USAGE_POLICY_ADDRESS);

  // 1. Publish Genesis Artifact
  console.log("\n--- Step 1: Publish Genesis ---");
  const genesisContentHash = ethers.keccak256(ethers.toUtf8Bytes("Genesis Content " + Date.now()));
  const metaURI = "ipfs://genesis";

  // Use creator account
  const txPublish = await registry.connect(creator).publish(
    genesisContentHash,
    PAYABLE_USAGE_POLICY_ADDRESS,
    metaURI
  );
  await txPublish.wait();

  // Get ID from mapping
  const genesisId = await registry.contentHashToId(genesisContentHash);
  console.log(`✅ Genesis Artifact Published. ID: ${genesisId}`);
  console.log(`   Tx: ${txPublish.hash}`);

  // 2. Set Fees
  console.log("\n--- Step 2: Set Fees for Genesis ---");
  const deriveFee = ethers.parseEther("0.01");  // Lower fees for testing
  const consumeFee = ethers.parseEther("0.001");

  const txSetFees = await policy.connect(creator).setFees(genesisId, deriveFee, consumeFee);
  await txSetFees.wait();
  console.log(`✅ Fees set: Derive ${ethers.formatEther(deriveFee)} ETH, Consume ${ethers.formatEther(consumeFee)} ETH`);
  console.log(`   Tx: ${txSetFees.hash}`);

  // 3. Derive Child Artifact
  console.log("\n--- Step 3: Derive Child (User derives from Creator) ---");
  const childContentHash = ethers.keccak256(ethers.toUtf8Bytes("Child Content " + Date.now()));
  const childMetaURI = "ipfs://child";

  // Check creator balance before
  const creatorBalanceBefore = await ethers.provider.getBalance(creator.address);

  // User derives from Genesis
  const txDerive = await registry.connect(user).derive(
    genesisId,
    childContentHash,
    PAYABLE_USAGE_POLICY_ADDRESS,
    childMetaURI,
    "0x", // no context
    { value: deriveFee }
  );
  await txDerive.wait();

  const childId = await registry.contentHashToId(childContentHash);
  console.log(`✅ Child Artifact Derived. ID: ${childId}`);
  console.log(`   Tx: ${txDerive.hash}`);

  // Check creator balance after (should have received fee)
  const creatorBalanceAfter = await ethers.provider.getBalance(creator.address);
  const diff = creatorBalanceAfter - creatorBalanceBefore;
  console.log(`💰 Creator Balance Change: +${ethers.formatEther(diff)} ETH (Expected: ${ethers.formatEther(deriveFee)})`);

  // 4. Consume Child Artifact
  console.log("\n--- Step 4: Consume Child (Creator consumes User's artifact) ---");

  // First set fees for child (by user, since user is publisher of child)
  const txSetChildFees = await policy.connect(user).setFees(childId, deriveFee, consumeFee);
  await txSetChildFees.wait();
  console.log(`✅ User set fees for Child ID ${childId}`);
  console.log(`   Tx: ${txSetChildFees.hash}`);

  // Creator consumes User's artifact
  const txConsume = await registry.connect(creator).consume(
    childId,
    "0x",
    { value: consumeFee }
  );
  await txConsume.wait();
  console.log(`✅ Child Artifact Consumed by Creator.`);
  console.log(`   Tx: ${txConsume.hash}`);

  console.log("\n🎉 Pipeline Test Completed Successfully!");
  console.log("\n📊 Summary:");
  console.log(`   Registry: ${ARTIFACT_REGISTRY_ADDRESS}`);
  console.log(`   Genesis ID: ${genesisId}`);
  console.log(`   Child ID: ${childId}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
