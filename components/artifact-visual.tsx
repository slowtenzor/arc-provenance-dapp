'use client'

import { Hash } from 'viem'
import { drunkenBishopSvg } from '@/lib/identicon'

export function ArtifactVisual({ hash }: { hash: Hash }) {
  const svg = drunkenBishopSvg(hash, { size: 360, padding: 18 })
  return (
    <div
      className="w-full flex items-center justify-center rounded-xl border border-border/30 bg-card/40 p-6"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
