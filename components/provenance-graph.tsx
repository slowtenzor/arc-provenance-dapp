'use client'

import { ProvenanceNode, AttestationNode, getAttestationKindLabel } from '@/lib/graph-builder'
import { Badge } from '@/components/ui/badge'
import { getExplorerTxUrl, getExplorerAddressUrl } from '@/lib/contracts'
import { ExternalLink, FileText, GitBranch, CheckCircle } from 'lucide-react'

interface ProvenanceGraphViewProps {
    roots: ProvenanceNode[]
}

function formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function NodeCard({ node, depth = 0 }: { node: ProvenanceNode; depth?: number }) {
    const isRoot = node.parentId === null

    return (
        <div className="relative">
            {/* Connection line */}
            {depth > 0 && (
                <div
                    className="absolute left-0 top-0 w-6 h-8 border-l-2 border-b-2 border-border/50 rounded-bl-lg"
                    style={{ marginLeft: '-24px', marginTop: '-8px' }}
                />
            )}

            <div className={`
        p-4 rounded-lg border border-border/30 bg-card/50 backdrop-blur
        hover:border-violet-500/50 transition-colors
        ${isRoot ? 'border-l-4 border-l-violet-500' : 'border-l-4 border-l-blue-500'}
      `}>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            {isRoot ? (
                                <FileText className="w-4 h-4 text-violet-400 flex-shrink-0" />
                            ) : (
                                <GitBranch className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            )}
                            <Badge variant={isRoot ? "default" : "secondary"} className="text-xs">
                                {isRoot ? 'Root' : 'Derivative'}
                            </Badge>
                            <span className="text-sm font-mono text-muted-foreground">
                                #{node.tokenId.toString()}
                            </span>
                        </div>

                        <div className="space-y-1 text-sm">
                            {!isRoot && node.parentId !== null && (
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">Lineage:</span>
                                    <span className="font-mono text-muted-foreground">
                                        #{node.tokenId.toString()} ← #{node.parentId.toString()}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Creator:</span>
                                <a
                                    href={getExplorerAddressUrl(node.actor)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-mono text-violet-400 hover:underline flex items-center gap-1"
                                >
                                    {formatAddress(node.actor)}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>
                    </div>

                    <a
                        href={getExplorerTxUrl(node.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 flex-shrink-0"
                    >
                        <span className="font-mono">{formatAddress(node.txHash)}</span>
                        <ExternalLink className="w-3 h-3" />
                    </a>
                </div>

                {/* Attestations */}
                {node.attestations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/30">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            <span className="text-xs text-muted-foreground">
                                {node.attestations.length} Attestation{node.attestations.length > 1 ? 's' : ''}
                            </span>
                        </div>
                        <div className="space-y-2">
                            {node.attestations.map((att, idx) => (
                                <AttestationCard key={idx} attestation={att} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Children */}
            {node.children.length > 0 && (
                <div className="ml-6 mt-3 space-y-3">
                    {node.children.map((child) => (
                        <NodeCard key={child.tokenId.toString()} node={child} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    )
}

function AttestationCard({ attestation }: { attestation: AttestationNode }) {
    const kindLabel = getAttestationKindLabel(attestation.kind)

    return (
        <div className="flex items-center justify-between gap-2 p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 min-w-0">
                <Badge variant="outline" className="text-xs border-emerald-500/50 text-emerald-400">
                    {kindLabel}
                </Badge>
                <a
                    href={getExplorerAddressUrl(attestation.attester)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-emerald-400 hover:underline"
                >
                    {formatAddress(attestation.attester)}
                </a>
            </div>
            <a
                href={getExplorerTxUrl(attestation.txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 flex-shrink-0"
            >
                <ExternalLink className="w-3 h-3" />
            </a>
        </div>
    )
}

export function ProvenanceGraphView({ roots }: ProvenanceGraphViewProps) {
    if (roots.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No provenance data found</p>
                <p className="text-sm mt-1">No assets have been created in this registry yet.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {roots.map((root) => (
                <NodeCard key={root.tokenId.toString()} node={root} />
            ))}
        </div>
    )
}
