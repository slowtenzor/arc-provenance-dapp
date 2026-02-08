# Arc Artifact Protocol (Reference Implementation)

A reference implementation for **Software as an Object (SaaO)** and the **Machine-to-Machine (M2M) Economy** on Arc Network.

> **Status:** Concept Draft (v0.1) / Proof of Concept
> **Chain:** Arc Testnet (ID: 5042002)

## 🏗 Overview

This repository demonstrates how autonomous software actors (agents, swarms) can publish, derive, and consume digital artifacts with on-chain provenance and executable usage policies.

Unlike traditional package managers (npm, pip) or licensing (MIT, GPL), this protocol:
1.  **Enforces Usage Policies On-Chain:** Licenses are smart contracts, not text files.
2.  **Tracks Provenance:** Every artifact has a verifiable lineage (parent -> child).
3.  **Enables M2M Economics:** Derivation and consumption can trigger automated USDC payments.

## 📦 Core Contracts

### ArtifactRegistryV1
**Address:** `0xD76546043E4d9bb7fA3Bd73533A02c82aE4be2f8`

The central registry that stores:
- **Artifact Metadata:** ID, Publisher, Content Hash (IPFS/Git), Type.
- **Lineage:** Parent Artifact ID (0 for genesis).
- **Policy Link:** The Usage Policy contract governing this artifact.

### PayableUsagePolicyV1
**Address:** `0x103944642c5Cc62BbF80d967c690f3EADac2b47e`

A standard implementation of a usage policy:
- **Derivation Fee:** Cost to fork/extend an artifact.
- **Consumption Fee:** Cost to run/use an artifact.
- **Currency:** USDC (native or bridged).

## 🚀 Concept: Software as an Object (SaaO)

In the era of AI Agents, software is not just code—it is an economic asset.

1.  **Publication:** An agent publishes code (e.g., a "Search Tool") as an Artifact.
2.  **Derivation:** Another agent forks it to create a "Specialized Search Tool". The protocol records the parent-child link.
3.  **Consumption:** A third agent pays to use the tool. Revenue flows to the creator (and potentially the parent creator) automatically.

## 🛠 Tech Stack

- **Frontend:** Next.js 16, Tailwind CSS v4, shadcn/ui
- **Web3:** RainbowKit, Wagmi v2, Viem v2
- **Contracts:** Solidity 0.8.20, Hardhat

## ⚡ Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the artifact graph.

## 🔗 Links

- **Discussion:** [Arc Artifact Protocol Concept Draft v0.1](https://github.com/slowtenzor/arc-provenance-dapp/discussions/3)
- **Explorer:** [ArcScan Testnet](https://testnet.arcscan.app/address/0xD76546043E4d9bb7fA3Bd73533A02c82aE4be2f8)
