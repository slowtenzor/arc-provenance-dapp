'use client'

import { ProvenanceNode, AttestationNode, getAttestationKindLabel } from '@/lib/graph-builder'
import { getExplorerTxUrl, getExplorerAddressUrl } from '@/lib/contracts'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ExternalLink } from 'lucide-react'

interface TransactionListProps {
    nodes: ProvenanceNode[]
    attestations: AttestationNode[]
}

function formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
}

type TransactionRow = {
    type: 'root' | 'derive' | 'attest'
    txHash: string
    actor: string
    tokenId: string
    blockNumber: bigint
    kind?: number  // for attestations
}

export function TransactionList({ nodes, attestations }: TransactionListProps) {
    // Flatten all nodes recursively
    const flattenNodes = (nodeList: ProvenanceNode[]): ProvenanceNode[] => {
        const result: ProvenanceNode[] = []
        for (const node of nodeList) {
            result.push(node)
            if (node.children.length > 0) {
                result.push(...flattenNodes(node.children))
            }
        }
        return result
    }

    const allNodes = flattenNodes(nodes)

    // Combine all transactions
    const transactions: TransactionRow[] = [
        ...allNodes.map((n) => ({
            type: (n.parentId === null ? 'root' : 'derive') as 'root' | 'derive',
            txHash: n.txHash,
            actor: n.actor,
            tokenId: n.tokenId.toString(),
            blockNumber: n.blockNumber,
        })),
        ...attestations.map((a) => ({
            type: 'attest' as const,
            txHash: a.txHash,
            actor: a.attester,
            tokenId: a.tokenId.toString(),
            blockNumber: a.blockNumber,
            kind: a.kind,
        })),
    ]

    // Dedup by txHash + type + tokenId (+ kind for attest)
    const seen = new Set<string>()
    const deduped: TransactionRow[] = []
    for (const tx of transactions) {
        const key = `${tx.txHash}:${tx.type}:${tx.tokenId}:${tx.kind ?? ''}`
        if (seen.has(key)) continue
        seen.add(key)
        deduped.push(tx)
    }

    // Sort by block number descending
    deduped.sort((a, b) => Number(b.blockNumber - a.blockNumber))

    if (deduped.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No transactions found
            </div>
        )
    }

    const getBadgeVariant = (type: string) => {
        switch (type) {
            case 'root': return 'default'
            case 'derive': return 'secondary'
            case 'attest': return 'outline'
            default: return 'default'
        }
    }

    const getTypeLabel = (tx: TransactionRow) => {
        if (tx.type === 'attest' && tx.kind !== undefined) {
            return getAttestationKindLabel(tx.kind)
        }
        return tx.type === 'root' ? 'Root' : 'Derive'
    }

    return (
        <div className="rounded-lg border border-border/30 overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/30">
                        <TableHead className="w-24">Type</TableHead>
                        <TableHead>Token ID</TableHead>
                        <TableHead>Actor</TableHead>
                        <TableHead>Block</TableHead>
                        <TableHead className="text-right">Transaction</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {deduped.slice(0, 20).map((tx, idx) => (
                        <TableRow key={`${tx.txHash}-${idx}`} className="border-border/30">
                            <TableCell>
                                <Badge variant={getBadgeVariant(tx.type)} className="capitalize text-xs">
                                    {getTypeLabel(tx)}
                                </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                                #{tx.tokenId}
                            </TableCell>
                            <TableCell>
                                <a
                                    href={getExplorerAddressUrl(tx.actor)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-mono text-sm text-violet-400 hover:underline inline-flex items-center gap-1"
                                >
                                    {formatAddress(tx.actor)}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </TableCell>
                            <TableCell className="font-mono text-sm text-muted-foreground">
                                {tx.blockNumber.toString()}
                            </TableCell>
                            <TableCell className="text-right">
                                <a
                                    href={getExplorerTxUrl(tx.txHash)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-mono text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 justify-end"
                                >
                                    {formatAddress(tx.txHash)}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
