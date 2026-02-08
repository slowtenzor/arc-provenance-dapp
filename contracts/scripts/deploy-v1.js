const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  console.log("\n--- Deploying ArtifactRegistryV1 ---");
  const ArtifactRegistryV1 = await ethers.getContractFactory("ArtifactRegistryV1");
  const registry = await ArtifactRegistryV1.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("ArtifactRegistryV1:", registryAddr);

  console.log("\n--- Deploying PayableUsagePolicyV1 ---");
  const PayableUsagePolicyV1 = await ethers.getContractFactory("PayableUsagePolicyV1");
  const policy = await PayableUsagePolicyV1.deploy(registryAddr);
  await policy.waitForDeployment();
  const policyAddr = await policy.getAddress();
  console.log("PayableUsagePolicyV1:", policyAddr);

  const regVersion = await registry.VERSION();
  const polVersion = await policy.VERSION();
  console.log("\nVersions — Registry:", regVersion.toString(), "Policy:", polVersion.toString());

  const deployed = {
    network: "arcTestnet",
    chainId: 5042002,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    version: "v1",
    contracts: {
      ArtifactRegistryV1: { address: registryAddr },
      PayableUsagePolicyV1: { address: policyAddr },
      DigitalObjectNFT: { address: "0x87020198e7595C60b200EA80be41548F44573365" },
      ProvenanceRegistryV2: { address: "0xF015b52C9739Dc8D0739e7f7700eC7bbaE9B77C7" },
    },
  };
  fs.writeFileSync("deployed.json", JSON.stringify(deployed, null, 2));
  console.log("\nDeployed config written to deployed.json");
  console.log("\n✅ Deployment complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
