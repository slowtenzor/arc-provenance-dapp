import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: "../.env.local" });

// Load wallets from batch_2.json for testing
let testWallets: string[] = [];

// Try multiple paths to find batch_2.json
const possiblePaths = [
    path.resolve(process.cwd(), "../arc-automata/batches/batch_2.json"),
    path.resolve(process.cwd(), "../../arc-automata/batches/batch_2.json"),
    "/Users/road/Documents/WORKS/ARC/arc-automata/batches/batch_2.json",
];

for (const batchPath of possiblePaths) {
    try {
        if (fs.existsSync(batchPath)) {
            const batch = JSON.parse(fs.readFileSync(batchPath, "utf-8"));
            testWallets = batch.slice(0, 5).map((w: { private_key: string }) => w.private_key);
            console.log(`Loaded ${testWallets.length} wallets from ${batchPath}`);
            break;
        }
    } catch {
        // continue to next path
    }
}

if (testWallets.length === 0) {
    console.warn("Warning: Could not load batch_2.json, using default key");
}

// Fallback to env or dummy key
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";
const accounts = testWallets.length >= 3 ? testWallets : [PRIVATE_KEY];

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: false, // Disabled for Full Match verification
            },
        },
    },
    networks: {
        arcTestnet: {
            url: "https://rpc.testnet.arc.network",
            chainId: 5042002,
            accounts,
        },
    },
};

export default config;
