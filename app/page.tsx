import { WalletConnect } from '@/components/wallet-connect'
import { NftSearch } from '@/components/nft-search'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PROVENANCE_REGISTRY_ADDRESS } from '@/lib/contracts'
import { GitBranch, ExternalLink } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-[80vh] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Arc Artifacts</h1>
            <p className="text-xs text-muted-foreground">Onchain Artifact Lineage</p>
          </div>
        </div>
        <WalletConnect />
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 -mt-20">
        <div className="space-y-4">
          <Badge variant="secondary" className="px-4 py-1">
            Arc Network Testnet
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Visualize
            <span className="bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">
              {' '}Artifact
            </span>
            {' '}Provenance
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Explore onchain lineage of software artifacts. Track publications, derivations, and attestations.
          </p>
        </div>

        <NftSearch />

        {/* Example addresses */}
        <Card className="bg-card/30 border-border/30 backdrop-blur">
          <CardContent className="pt-6 space-y-3">
            <p className="text-sm text-muted-foreground">Try with the deployed registry:</p>
            <a
              href={`/nft/${PROVENANCE_REGISTRY_ADDRESS}`}
              className="font-mono text-sm text-violet-400 hover:underline inline-flex items-center gap-2"
            >
              {PROVENANCE_REGISTRY_ADDRESS}
              <ExternalLink className="w-3 h-3" />
            </a>
            <div className="pt-2 border-t border-border/30">
              <a
                href={`/nft/${PROVENANCE_REGISTRY_ADDRESS}?mock=true`}
                className="text-sm text-yellow-400 hover:underline inline-flex items-center gap-2"
              >
                🎯 View Demo with Sample Data
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>
          Built for{' '}
          <a
            href="https://arc.network"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-400 hover:underline"
          >
            Arc Network
          </a>
        </p>
      </footer>
    </div>
  )
}
