import { Address, Hash, PublicClient } from 'viem'
import { ARTIFACT_REGISTRY_ABI, ARTIFACT_REGISTRY_V1_ADDRESS } from './contracts'

export type ArtifactPublished = {
  artifactId: bigint
  publisher: Address
  parentId: bigint
  usagePolicy: Address
  contentHash: Hash
  txHash: Hash
  blockNumber: bigint
}

export async function fetchArtifactPublished(
  client: PublicClient,
  artifactId: bigint,
  registryAddress: Address = ARTIFACT_REGISTRY_V1_ADDRESS
): Promise<ArtifactPublished | null> {
  const currentBlock = await client.getBlockNumber()

  const logs = await client.getLogs({
    address: registryAddress,
    event: ARTIFACT_REGISTRY_ABI[0],
    args: { artifactId },
    fromBlock: 0n,
    toBlock: currentBlock,
  })

  if (!logs.length) return null

  const last = logs[logs.length - 1]
  const args = last.args as unknown as {
    artifactId: bigint
    publisher: Address
    parentId: bigint
    usagePolicy: Address
    contentHash: Hash
  }

  return {
    artifactId: args.artifactId,
    publisher: args.publisher,
    parentId: args.parentId,
    usagePolicy: args.usagePolicy,
    contentHash: args.contentHash,
    txHash: last.transactionHash as Hash,
    blockNumber: last.blockNumber,
  }
}

export async function fetchLatestArtifactIds(
  client: PublicClient,
  opts?: { limit?: number; registryAddress?: Address; fromBlock?: bigint }
): Promise<bigint[]> {
  const limit = opts?.limit ?? 20
  const registryAddress = opts?.registryAddress ?? ARTIFACT_REGISTRY_V1_ADDRESS
  const currentBlock = await client.getBlockNumber()

  const logs = await client.getLogs({
    address: registryAddress,
    event: ARTIFACT_REGISTRY_ABI[0],
    fromBlock: opts?.fromBlock ?? 0n,
    toBlock: currentBlock,
  })

  // keep unique, but preserve chronological order (by block/log index order)
  const ids: bigint[] = []
  const seen = new Set<string>()
  for (const lg of logs) {
    const args = lg.args as unknown as { artifactId: bigint }
    const k = args.artifactId.toString()
    if (seen.has(k)) continue
    seen.add(k)
    ids.push(args.artifactId)
  }

  // latest first
  return ids.slice(-limit).reverse()
}
