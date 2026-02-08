import { Address } from 'viem'

// Contract addresses on Arc Testnet
// Legacy (Provenance v2)
export const DIGITAL_OBJECT_NFT_ADDRESS: Address = '0x87020198e7595C60b200EA80be41548F44573365'
export const PROVENANCE_REGISTRY_ADDRESS: Address = '0xF015b52C9739Dc8D0739e7f7700eC7bbaE9B77C7'

// Artifact Protocol (v1)
export const ARTIFACT_REGISTRY_V1_ADDRESS: Address = '0xD76546043E4d9bb7fA3Bd73533A02c82aE4be2f8'
export const PAYABLE_USAGE_POLICY_V1_ADDRESS: Address = '0x103944642c5Cc62BbF80d967c690f3EADac2b47e'

// Attestation kinds
export const ATTESTATION_KIND = {
    SOURCE: 1,
    QUALITY: 2,
    REVIEW: 3,
    LICENSE: 4,
} as const

// DigitalObjectNFT ABI
export const DIGITAL_OBJECT_NFT_ABI = [
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: 'tokenId', type: 'uint256' },
            { indexed: true, name: 'to', type: 'address' },
            { indexed: false, name: 'seedURI', type: 'string' },
        ],
        name: 'Minted',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: 'tokenId', type: 'uint256' },
            { indexed: false, name: 'forksOut', type: 'uint32' },
            { indexed: false, name: 'forksIn', type: 'uint32' },
            { indexed: false, name: 'attestCount', type: 'uint32' },
            { indexed: false, name: 'score', type: 'uint16' },
            { indexed: false, name: 'ref', type: 'bytes32' },
        ],
        name: 'StatsUpdated',
        type: 'event',
    },
    {
        inputs: [{ name: 'to', type: 'address' }, { name: 'seedURI', type: 'string' }],
        name: 'mint',
        outputs: [{ name: 'tokenId', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        name: 'ownerOf',
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        name: 'tokenURI',
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        name: 'stats',
        outputs: [
            { name: 'forksOut', type: 'uint32' },
            { name: 'forksIn', type: 'uint32' },
            { name: 'attestCount', type: 'uint32' },
            { name: 'score', type: 'uint16' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'totalSupply',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const

// ProvenanceRegistryV2 ABI
export const PROVENANCE_REGISTRY_ABI = [
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: 'nft', type: 'address' },
            { indexed: true, name: 'parentId', type: 'uint256' },
            { indexed: true, name: 'childId', type: 'uint256' },
            { indexed: false, name: 'actor', type: 'address' },
            { indexed: false, name: 'ref', type: 'bytes32' },
        ],
        name: 'Derived',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: 'nft', type: 'address' },
            { indexed: true, name: 'tokenId', type: 'uint256' },
            { indexed: true, name: 'attester', type: 'address' },
            { indexed: false, name: 'kind', type: 'uint8' },
            { indexed: false, name: 'ref', type: 'bytes32' },
            { indexed: false, name: 'payloadHash', type: 'bytes32' },
        ],
        name: 'Attested',
        type: 'event',
    },
    {
        inputs: [
            { name: 'nft', type: 'address' },
            { name: 'parentId', type: 'uint256' },
            { name: 'childId', type: 'uint256' },
            { name: 'ref', type: 'bytes32' },
        ],
        name: 'derive',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { name: 'nft', type: 'address' },
            { name: 'tokenId', type: 'uint256' },
            { name: 'kind', type: 'uint8' },
            { name: 'ref', type: 'bytes32' },
            { name: 'payloadHash', type: 'bytes32' },
        ],
        name: 'attest',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const

export const EXPLORER_URL = 'https://testnet.arcscan.app'

export function getExplorerTxUrl(txHash: string): string {
    return `${EXPLORER_URL}/tx/${txHash}`
}

export function getExplorerAddressUrl(address: string): string {
    return `${EXPLORER_URL}/address/${address}`
}

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
