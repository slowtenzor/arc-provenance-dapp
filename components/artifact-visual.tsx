'use client'

import { Hash } from 'viem'
import { identiconSvg } from '@/lib/identicon'

export function ArtifactVisual({ hash }: { hash: Hash }) {
  const svg = identiconSvg(hash, { size: 360, padding: 22 })
  return (
    <div
      className="w-full flex items-center justify-center rounded-xl border border-border/30 bg-card/40 p-6"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
