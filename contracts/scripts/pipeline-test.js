const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  console.log("🚀 Starting Pipeline Test...");

  // Get signers
  const [owner, creator, user] = await ethers.getSigners();
  console.log("Testing with accounts:");
  console.log("  Owner:  ", owner.address);
  console.log("  Creator:", creator.address);
  console.log("  User:   ", user.address);

  // 1. Deploy Registry
  console.log("\n--- Deploying Contracts ---");
  const ArtifactRegistry = await ethers.getContractFactory("ArtifactRegistryV1");
  const registry = await ArtifactRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("✅ ArtifactRegistryV1 deployed to:", registryAddress);

  // 2. Deploy Policy
  const PayableUsagePolicy = await ethers.getContractFactory("PayableUsagePolicyV1");
  const policy = await PayableUsagePolicy.deploy(registryAddress);
  await policy.waitForDeployment();
  const policyAddress = await policy.getAddress();
  console.log("✅ PayableUsagePolicyV1 deployed to:", policyAddress);

  // 3. Publish Genesis Artifact
  console.log("\n--- Step 1: Publish Genesis ---");
  const genesisContentHash = ethers.keccak256(ethers.toUtf8Bytes("Genesis Content " + Date.now()));
  const metaURI = "ipfs://genesis";
  
  // Use creator account
  const txPublish = await registry.connect(creator).publish(
    genesisContentHash,
    policyAddress,
    metaURI
  );
  await txPublish.wait();
  
  // Get ID from mapping
  const genesisId = await registry.contentHashToId(genesisContentHash);
  console.log(`✅ Genesis Artifact Published. ID: ${genesisId}`);

  // 4. Set Fees
  console.log("\n--- Step 2: Set Fees for Genesis ---");
  const deriveFee = ethers.parseEther("1.0");
  const consumeFee = ethers.parseEther("0.1");
  
  await policy.connect(creator).setFees(genesisId, deriveFee, consumeFee);
  console.log(`✅ Fees set: Derive ${ethers.formatEther(deriveFee)} ETH, Consume ${ethers.formatEther(consumeFee)} ETH`);

  // 5. Derive Child Artifact
  console.log("\n--- Step 3: Derive Child (User derives from Creator) ---");
  const childContentHash = ethers.keccak256(ethers.toUtf8Bytes("Child Content " + Date.now()));
  const childMetaURI = "ipfs://child";
  
  // Check creator balance before
  const creatorBalanceBefore = await ethers.provider.getBalance(creator.address);

  // User derives from Genesis
  const txDerive = await registry.connect(user).derive(
    genesisId,
    childContentHash,
    policyAddress,
    childMetaURI,
    "0x", // no context
    { value: deriveFee }
  );
  await txDerive.wait();
  
  const childId = await registry.contentHashToId(childContentHash);
  console.log(`✅ Child Artifact Derived. ID: ${childId}`);

  // Check creator balance after (should have received fee)
  const creatorBalanceAfter = await ethers.provider.getBalance(creator.address);
  const diff = creatorBalanceAfter - creatorBalanceBefore;
  console.log(`💰 Creator Balance Change: +${ethers.formatEther(diff)} ETH (Expected: 1.0)`);

  // 6. Consume Child Artifact
  console.log("\n--- Step 4: Consume Child (Creator consumes User's artifact) ---");
  
  // First set fees for child (by user, since user is publisher of child)
  await policy.connect(user).setFees(childId, deriveFee, consumeFee);
  console.log(`✅ User set fees for Child ID ${childId}`);

  // Creator consumes User's artifact
  const txConsume = await registry.connect(creator).consume(
    childId,
    "0x",
    { value: consumeFee }
  );
  await txConsume.wait();
  console.log(`✅ Child Artifact Consumed by Creator.`);

  console.log("\n🎉 Pipeline Test Completed Successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
