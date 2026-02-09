'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { createPublicClient, http } from 'viem'
import { arcTestnet } from '@/lib/chains'
import {
  ARTIFACT_REGISTRY_V1_ADDRESS,
  getExplorerAddressUrl,
  getExplorerTxUrl,
} from '@/lib/contracts'
import { fetchArtifactPublished, ArtifactPublished } from '@/lib/artifacts'
import { WalletConnect } from '@/components/wallet-connect'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArtifactVisual } from '@/components/artifact-visual'
import { ArrowLeft, ExternalLink } from 'lucide-react'

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function ArtifactPage() {
  const params = useParams()
  const idStr = (params.id as string) ?? ''

  const artifactId = useMemo(() => {
    // Accept decimal (e.g. 12) and hex (0x0c)
    try {
      if (idStr.startsWith('0x')) return BigInt(idStr)
      return BigInt(idStr)
    } catch {
      return null
    }
  }, [idStr])

  const client = useMemo(() => createPublicClient({ chain: arcTestnet, transport: http() }), [])

  const [data, setData] = useState<ArtifactPublished | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (artifactId === null) {
        setError('Invalid artifact id')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const ev = await fetchArtifactPublished(client, artifactId)
        if (!cancelled) setData(ev)
      } catch (e) {
        console.error(e)
        if (!cancelled) setError('Failed to load artifact')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [client, artifactId])

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href={`/registry/${ARTIFACT_REGISTRY_V1_ADDRESS}`} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Artifact</h1>
            <p className="text-xs text-muted-foreground">Arc Network Testnet</p>
          </div>
        </div>
        <WalletConnect />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-card/50 border-border/30">
          <CardHeader>
            <CardTitle className="text-lg">Visual fingerprint</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[420px] w-full" />
            ) : data ? (
              <ArtifactVisual hash={data.contentHash} />
            ) : (
              <div className="text-sm text-muted-foreground">No data</div>
            )}
            <div className="mt-4 text-xs text-muted-foreground">
              Deterministic SVG derived from contentHash (identicon/randomart style).
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/30">
          <CardHeader>
            <CardTitle className="text-lg">Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-destructive text-sm">
                {error}
              </div>
            )}

            {loading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : data ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Artifact #{data.artifactId.toString()}</Badge>
                  <Badge variant="outline">Registry</Badge>
                  <a
                    href={getExplorerAddressUrl(ARTIFACT_REGISTRY_V1_ADDRESS)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-violet-400 hover:underline inline-flex items-center gap-1"
                  >
                    {formatAddress(ARTIFACT_REGISTRY_V1_ADDRESS)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Publisher</span>
                    <a
                      href={getExplorerAddressUrl(data.publisher)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-violet-400 hover:underline inline-flex items-center gap-1"
                    >
                      {formatAddress(data.publisher)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Parent</span>
                    <span className="font-mono">{data.parentId.toString()}</span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Usage policy</span>
                    <a
                      href={getExplorerAddressUrl(data.usagePolicy)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-violet-400 hover:underline inline-flex items-center gap-1"
                    >
                      {formatAddress(data.usagePolicy)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">contentHash</span>
                    <span className="font-mono text-xs break-all text-right">{data.contentHash}</span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Transaction</span>
                    <a
                      href={getExplorerTxUrl(data.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-violet-400 hover:underline inline-flex items-center gap-1"
                    >
                      {formatAddress(data.txHash)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Block</span>
                    <span className="font-mono text-muted-foreground">{data.blockNumber.toString()}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Artifact not found (no ArtifactPublished event)</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
