import { PublicClient, Address, Hash } from 'viem'
import {
    PROVENANCE_REGISTRY_ADDRESS,
    DIGITAL_OBJECT_NFT_ADDRESS,
    ARTIFACT_REGISTRY_V1_ADDRESS,
    ATTESTATION_KIND
} from './contracts'

// Types for MVP 1
export interface ProvenanceNode {
    tokenId: bigint
    parentId: bigint | null  // null for root nodes
    actor: Address
    ref: Hash
    txHash: Hash
    blockNumber: bigint
    children: ProvenanceNode[]
    attestations: AttestationNode[]
}

export interface AttestationNode {
    tokenId: bigint
    attester: Address
    kind: number
    ref: Hash
    payloadHash: Hash
    txHash: Hash
    blockNumber: bigint
}

export interface ProvenanceGraph {
    roots: ProvenanceNode[]
    totalAssets: number
    totalDerivatives: number
    totalAttestations: number
    maxDepth: number
}

// Event arguments
interface DerivedEventArgs {
    nft: Address
    parentId: bigint
    childId: bigint
    actor: Address
    ref: Hash
}

interface AttestedEventArgs {
    nft: Address
    tokenId: bigint
    attester: Address
    kind: number
    ref: Hash
    payloadHash: Hash
}

// Constants
const CHUNK_SIZE = 9000n
// ArtifactRegistryV1 deployed around block 25.9M on Arc Testnet
const CONTRACT_DEPLOY_BLOCK = 25900000n

// Event definitions for MVP 1
const DERIVED_EVENT = {
    type: 'event' as const,
    name: 'Derived',
    inputs: [
        { indexed: true, name: 'nft', type: 'address' },
        { indexed: true, name: 'parentId', type: 'uint256' },
        { indexed: true, name: 'childId', type: 'uint256' },
        { indexed: false, name: 'actor', type: 'address' },
        { indexed: false, name: 'ref', type: 'bytes32' },
    ],
}

const ATTESTED_EVENT = {
    type: 'event' as const,
    name: 'Attested',
    inputs: [
        { indexed: true, name: 'nft', type: 'address' },
        { indexed: true, name: 'tokenId', type: 'uint256' },
        { indexed: true, name: 'attester', type: 'address' },
        { indexed: false, name: 'kind', type: 'uint8' },
        { indexed: false, name: 'ref', type: 'bytes32' },
        { indexed: false, name: 'payloadHash', type: 'bytes32' },
    ],
}

// Fetch events in chunks to work around RPC limits
async function fetchLogsInChunks<T>(
    client: PublicClient,
    event: typeof DERIVED_EVENT | typeof ATTESTED_EVENT,
    fromBlock: bigint,
    toBlock: bigint,
    parseLog: (log: { args: unknown; transactionHash: Hash | null; blockNumber: bigint }) => T
): Promise<T[]> {
    const results: T[] = []
    let currentFrom = fromBlock

    while (currentFrom <= toBlock) {
        const currentTo = currentFrom + CHUNK_SIZE > toBlock ? toBlock : currentFrom + CHUNK_SIZE

        try {
            const logs = await client.getLogs({
                address: PROVENANCE_REGISTRY_ADDRESS,
                event,
                fromBlock: currentFrom,
                toBlock: currentTo,
            })

            for (const log of logs) {
                results.push(parseLog({
                    args: log.args,
                    transactionHash: log.transactionHash,
                    blockNumber: log.blockNumber,
                }))
            }
        } catch (error) {
            console.error(`Failed to fetch logs from ${currentFrom} to ${currentTo}:`, error)
        }

        currentFrom = currentTo + 1n
    }

    return results
}

// Parse Derived events into node relationships
interface DerivedRelation {
    parentId: bigint
    childId: bigint
    actor: Address
    ref: Hash
    txHash: Hash
    blockNumber: bigint
}

export async function fetchDerivedEvents(
    client: PublicClient,
    nftAddress: Address = DIGITAL_OBJECT_NFT_ADDRESS,
    fromBlock?: bigint
): Promise<DerivedRelation[]> {
    const currentBlock = await client.getBlockNumber()
    const startBlock = fromBlock ?? CONTRACT_DEPLOY_BLOCK

    const parseLog = (log: { args: unknown; transactionHash: Hash | null; blockNumber: bigint }): DerivedRelation | null => {
        const args = log.args as unknown as DerivedEventArgs
        // Filter by NFT address
        if (args.nft.toLowerCase() !== nftAddress.toLowerCase()) {
            return null
        }
        return {
            parentId: args.parentId,
            childId: args.childId,
            actor: args.actor,
            ref: args.ref,
            txHash: log.transactionHash as Hash,
            blockNumber: log.blockNumber,
        }
    }

    const results = await fetchLogsInChunks(
        client,
        DERIVED_EVENT,
        startBlock,
        currentBlock,
        parseLog
    )

    return results.filter((r): r is DerivedRelation => r !== null)
}

export async function fetchAttestedEvents(
    client: PublicClient,
    nftAddress: Address = DIGITAL_OBJECT_NFT_ADDRESS,
    fromBlock?: bigint
): Promise<AttestationNode[]> {
    const currentBlock = await client.getBlockNumber()
    const startBlock = fromBlock ?? CONTRACT_DEPLOY_BLOCK

    const parseLog = (log: { args: unknown; transactionHash: Hash | null; blockNumber: bigint }): AttestationNode | null => {
        const args = log.args as unknown as AttestedEventArgs
        // Filter by NFT address
        if (args.nft.toLowerCase() !== nftAddress.toLowerCase()) {
            return null
        }
        return {
            tokenId: args.tokenId,
            attester: args.attester,
            kind: args.kind,
            ref: args.ref,
            payloadHash: args.payloadHash,
            txHash: log.transactionHash as Hash,
            blockNumber: log.blockNumber,
        }
    }

    const results = await fetchLogsInChunks(
        client,
        ATTESTED_EVENT,
        startBlock,
        currentBlock,
        parseLog
    )

    return results.filter((r): r is AttestationNode => r !== null)
}

// Build hierarchical graph from Derived events
export function buildProvenanceGraph(
    derivedEvents: DerivedRelation[],
    attestations: AttestationNode[]
): ProvenanceGraph {
    // Collect all unique token IDs
    const allTokenIds = new Set<string>()
    const childToParent = new Map<string, { parentId: bigint; relation: DerivedRelation }>()

    for (const event of derivedEvents) {
        allTokenIds.add(event.parentId.toString())
        allTokenIds.add(event.childId.toString())
        childToParent.set(event.childId.toString(), { parentId: event.parentId, relation: event })
    }

    // Build nodes
    const nodeMap = new Map<string, ProvenanceNode>()

    for (const tokenIdStr of allTokenIds) {
        const tokenId = BigInt(tokenIdStr)
        const childInfo = childToParent.get(tokenIdStr)

        const node: ProvenanceNode = {
            tokenId,
            parentId: childInfo ? childInfo.parentId : null,
            actor: childInfo?.relation.actor ?? '0x0000000000000000000000000000000000000000' as Address,
            ref: childInfo?.relation.ref ?? '0x' + '0'.repeat(64) as Hash,
            txHash: childInfo?.relation.txHash ?? '0x' + '0'.repeat(64) as Hash,
            blockNumber: childInfo?.relation.blockNumber ?? 0n,
            children: [],
            attestations: [],
        }
        nodeMap.set(tokenIdStr, node)
    }

    // Attach attestations
    for (const attestation of attestations) {
        const node = nodeMap.get(attestation.tokenId.toString())
        if (node) {
            node.attestations.push(attestation)
        }
    }

    // Build parent-child relationships
    const roots: ProvenanceNode[] = []

    for (const node of nodeMap.values()) {
        if (node.parentId === null) {
            roots.push(node)
        } else {
            const parent = nodeMap.get(node.parentId.toString())
            if (parent) {
                parent.children.push(node)
            } else {
                // Parent not found, this becomes a root
                roots.push(node)
            }
        }
    }

    // Calculate stats
    const totalAssets = nodeMap.size
    const totalDerivatives = derivedEvents.length
    const totalAttestations = attestations.length

    // Calculate max depth
    function getDepth(node: ProvenanceNode): number {
        if (node.children.length === 0) return 1
        return 1 + Math.max(...node.children.map(getDepth))
    }

    const maxDepth = roots.length > 0 ? Math.max(...roots.map(getDepth)) : 0

    return {
        roots,
        totalAssets,
        totalDerivatives,
        totalAttestations,
        maxDepth,
    }
}

// Helper to fetch and build in one call
// Helper to fetch and build in one call
interface ArtifactPublishedEventArgs {
    artifactId: bigint
    publisher: Address
    parentId: bigint
    usagePolicy: Address
    contentHash: Hash
}


const ARTIFACT_PUBLISHED_EVENT = {
    type: 'event' as const,
    name: 'ArtifactPublished',
    inputs: [
        { indexed: true, name: 'artifactId', type: 'uint256' },
        { indexed: true, name: 'publisher', type: 'address' },
        { indexed: true, name: 'parentId', type: 'uint256' },
        { indexed: false, name: 'usagePolicy', type: 'address' },
        { indexed: false, name: 'contentHash', type: 'bytes32' },
    ],
}

async function fetchArtifactEvents(
    client: PublicClient,
    registryAddress: Address,
    fromBlock?: bigint
): Promise<DerivedRelation[]> {
    const currentBlock = await client.getBlockNumber()
    const startBlock = fromBlock ?? CONTRACT_DEPLOY_BLOCK
    const results: DerivedRelation[] = []
    let currentFrom = startBlock

    while (currentFrom <= currentBlock) {
        const currentTo = currentFrom + CHUNK_SIZE > currentBlock ? currentBlock : currentFrom + CHUNK_SIZE

        try {
            const logs = await client.getLogs({
                address: registryAddress,
                event: ARTIFACT_PUBLISHED_EVENT,
                fromBlock: currentFrom,
                toBlock: currentTo,
            })

            for (const log of logs) {
                const args = log.args as unknown as ArtifactPublishedEventArgs
                results.push({
                    parentId: args.parentId,
                    childId: args.artifactId,
                    actor: args.publisher,
                    ref: args.contentHash,
                    txHash: log.transactionHash as Hash,
                    blockNumber: log.blockNumber,
                })
            }
        } catch (error) {
            console.error(`Failed to fetch logs from ${currentFrom} to ${currentTo}:`, error)
        }
        currentFrom = currentTo + 1n
    }
    return results
}

export async function fetchProvenanceGraph(
    client: PublicClient,
    nftAddress: Address = DIGITAL_OBJECT_NFT_ADDRESS
): Promise<ProvenanceGraph> {

    // Switch logic based on address
    if (nftAddress.toLowerCase() === ARTIFACT_REGISTRY_V1_ADDRESS.toLowerCase()) {
        const derivedEvents = await fetchArtifactEvents(client, nftAddress)
        // ArtifactRegistry doesn't have Attestations in the same way (yet), or they are separate.
        // For now, return graph without attestations.
        return buildProvenanceGraph(derivedEvents, [])
    }

    const [derivedEvents, attestations] = await Promise.all([
        fetchDerivedEvents(client, nftAddress),
        fetchAttestedEvents(client, nftAddress),
    ])

    return buildProvenanceGraph(derivedEvents, attestations)
}

// Export attestation kind labels for UI
export function getAttestationKindLabel(kind: number): string {
    switch (kind) {
        case ATTESTATION_KIND.SOURCE:
            return 'Source'
        case ATTESTATION_KIND.QUALITY:
            return 'Quality'
        case ATTESTATION_KIND.REVIEW:
            return 'Review'
        case ATTESTATION_KIND.LICENSE:
            return 'License'
        default:
            return 'Unknown'
    }
}
