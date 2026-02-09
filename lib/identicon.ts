// Deterministic SVG identicon/randomart from bytes32 hash.
// Lightweight: no deps, works fully client-side.

import { Hash } from 'viem'

function hexToBytes(hex: string): number[] {
  const h = hex.startsWith('0x') ? hex.slice(2) : hex
  const out: number[] = []
  for (let i = 0; i < h.length; i += 2) out.push(parseInt(h.slice(i, i + 2), 16))
  return out
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

// Produces a 5x5 mirrored grid like classic identicons.
export function identiconSvg(hash: Hash, opts?: { size?: number; padding?: number }): string {
  const size = opts?.size ?? 320
  const padding = opts?.padding ?? 16

  const bytes = hexToBytes(hash)

  // Colors from first bytes
  const r = bytes[0] ?? 90
  const g = bytes[1] ?? 70
  const b = bytes[2] ?? 200

  // Make it punchy but not neon
  const fg = `rgb(${clamp(r, 40, 220)}, ${clamp(g, 40, 220)}, ${clamp(b, 40, 220)})`
  const bg = 'rgba(255,255,255,0.03)'
  const stroke = 'rgba(255,255,255,0.08)'

  const grid = 5
  const cell = Math.floor((size - padding * 2) / grid)
  const origin = padding

  // Bits: use remaining bytes as entropy
  const bits: number[] = []
  for (let i = 3; i < bytes.length; i++) {
    const v = bytes[i]
    for (let k = 0; k < 8; k++) bits.push((v >> k) & 1)
  }

  // Determine which cells are on for left 3 columns, mirror to right.
  const on: boolean[][] = Array.from({ length: grid }, () => Array.from({ length: grid }, () => false))
  let bi = 0
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < Math.ceil(grid / 2); x++) {
      const v = bits[bi++] ?? 0
      const isOn = v === 1
      on[y][x] = isOn
      on[y][grid - 1 - x] = isOn
    }
  }

  const rects: string[] = []
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      if (!on[y][x]) continue
      const rx = origin + x * cell
      const ry = origin + y * cell
      rects.push(`<rect x="${rx}" y="${ry}" width="${cell}" height="${cell}" rx="6" fill="${fg}" />`)
    }
  }

  const borderW = size
  const borderH = size

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${fg}" stop-opacity="0.85" />
      <stop offset="1" stop-color="${fg}" stop-opacity="0.55" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${borderW}" height="${borderH}" rx="18" fill="${bg}" stroke="${stroke}" />
  <g>
    ${rects.join('\n    ')}
  </g>
  <rect x="${origin}" y="${origin}" width="${cell * grid}" height="${cell * grid}" rx="14" fill="none" stroke="url(#g)" stroke-opacity="0.35" />
</svg>`
}
