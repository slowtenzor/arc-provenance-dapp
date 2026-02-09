'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createPublicClient, http, Address } from 'viem'
import Link from 'next/link'
import { arcTestnet } from '@/lib/chains'
import { fetchProvenanceGraph, ProvenanceGraph, ProvenanceNode, AttestationNode } from '@/lib/graph-builder'
import { generateMockProvenanceGraph } from '@/lib/mock-data'
import {
    getExplorerAddressUrl,
    ARTIFACT_REGISTRY_V1_ADDRESS,
    DIGITAL_OBJECT_NFT_ADDRESS,
    PAYABLE_USAGE_POLICY_V1_ADDRESS,
} from '@/lib/contracts'
import { fetchLatestArtifactIds } from '@/lib/artifacts'
import { WalletConnect } from '@/components/wallet-connect'
import { ProvenanceMetrics } from '@/components/provenance-metrics'
import { ProvenanceGraphView } from '@/components/provenance-graph'
import { TransactionList } from '@/components/transaction-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { GitBranch, ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Collect all attestations
function collectAttestations(nodes: ProvenanceNode[]): AttestationNode[] {
    const result: AttestationNode[] = []
    for (const node of nodes) {
        result.push(...node.attestations)
        if (node.children.length > 0) {
            result.push(...collectAttestations(node.children))
        }
    }
    return result
}

export default function NftAnalysisPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const address = params.address as string
    const useMock = searchParams.get('mock') === 'true'

    const [graph, setGraph] = useState<ProvenanceGraph | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [latestArtifacts, setLatestArtifacts] = useState<bigint[] | null>(null)
    const [latestLoading, setLatestLoading] = useState(false)

    const fetchData = useCallback(async () => {
        setLoading(true)
        setError(null)

        // Use mock data if ?mock=true
        if (useMock) {
            await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate loading
            setGraph(generateMockProvenanceGraph())
            setLoading(false)
            return
        }

        try {
            const client = createPublicClient({
                chain: arcTestnet,
                transport: http(),
            })

            const provenanceGraph = await fetchProvenanceGraph(client, address as Address)
            setGraph(provenanceGraph)

            // For the main ArtifactRegistry, also show a simple "latest artifacts" list.
            if ((address as string).toLowerCase() === ARTIFACT_REGISTRY_V1_ADDRESS.toLowerCase()) {
                setLatestLoading(true)
                try {
                    const ids = await fetchLatestArtifactIds(client, { limit: 20 })
                    setLatestArtifacts(ids)
                } finally {
                    setLatestLoading(false)
                }
            } else {
                setLatestArtifacts(null)
            }
        } catch (err) {
            console.error('Failed to fetch provenance data:', err)
            setError('Failed to fetch provenance data. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [address, useMock])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const allAttestations = graph ? collectAttestations(graph.roots) : []

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <GitBranch className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Artifact Provenance</h1>
                            <p className="text-xs text-muted-foreground">Arc Network Testnet</p>
                        </div>
                    </div>
                </div>
                <WalletConnect />
            </header>

            {/* Contracts */}
            <Card className="mb-8 bg-card/50 border-border/30">
                <CardContent className="py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold">Contracts</h3>
                            {useMock && (
                                <Badge
                                    variant="secondary"
                                    className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                >
                                    Demo Mode
                                </Badge>
                            )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-4">
                            <Badge variant="outline" className="text-xs w-28 justify-center">
                                ArtifactRegistry
                            </Badge>
                            <a
                                href={getExplorerAddressUrl(ARTIFACT_REGISTRY_V1_ADDRESS)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-sm text-violet-400 hover:underline inline-flex items-center gap-2"
                            >
                                {ARTIFACT_REGISTRY_V1_ADDRESS}
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                        <div className="flex items-center gap-4">
                            <Badge variant="outline" className="text-xs w-28 justify-center">
                                PayablePolicy
                            </Badge>
                            <a
                                href={getExplorerAddressUrl(PAYABLE_USAGE_POLICY_V1_ADDRESS)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-sm text-violet-400 hover:underline inline-flex items-center gap-2"
                            >
                                {PAYABLE_USAGE_POLICY_V1_ADDRESS}
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                        <div className="flex items-center gap-4">
                            <Badge variant="outline" className="text-xs w-28 justify-center">
                                DigitalObject
                            </Badge>
                            <a
                                href={getExplorerAddressUrl(DIGITAL_OBJECT_NFT_ADDRESS)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-sm text-violet-400 hover:underline inline-flex items-center gap-2"
                            >
                                {DIGITAL_OBJECT_NFT_ADDRESS}
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Error State */}
            {error && (
                <Card className="mb-8 border-destructive/50 bg-destructive/10">
                    <CardContent className="py-4">
                        <p className="text-destructive">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Metrics */}
            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="bg-card/50 border-border/30">
                            <CardHeader className="pb-2">
                                <Skeleton className="h-4 w-20" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-12" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : graph ? (
                <div className="mb-8">
                    <ProvenanceMetrics graph={graph} />
                </div>
            ) : null}

            {/* Latest artifacts (WOW) */}
            {!loading && (address as string).toLowerCase() === ARTIFACT_REGISTRY_V1_ADDRESS.toLowerCase() && (
                <Card className="mb-8 bg-card/50 border-border/30">
                    <CardHeader>
                        <CardTitle className="text-lg">Latest artifacts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {latestLoading ? (
                            <div className="space-y-2">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-6 w-full" />
                                ))}
                            </div>
                        ) : latestArtifacts && latestArtifacts.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {latestArtifacts.map((id) => (
                                    <Link
                                        key={id.toString()}
                                        href={`/artifact/${id.toString()}`}
                                        className="inline-flex items-center rounded-md border border-border/40 bg-card/30 px-3 py-1 text-sm font-mono text-violet-300 hover:bg-card/50 hover:underline"
                                    >
                                        #{id.toString()}
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground">No artifacts found in logs yet.</div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Provenance Graph */}
                <Card className="bg-card/50 border-border/30">
                    <CardHeader>
                        <CardTitle className="text-lg">Lineage</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <Skeleton key={i} className="h-24 w-full" />
                                ))}
                            </div>
                        ) : graph ? (
                            <ProvenanceGraphView roots={graph.roots} />
                        ) : null}
                    </CardContent>
                </Card>

                {/* Transaction List */}
                <Card className="bg-card/50 border-border/30">
                    <CardHeader>
                        <CardTitle className="text-lg">Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-2">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        ) : (
                            <TransactionList roots={graph?.roots ?? []} attestations={allAttestations} />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
