// Drunken bishop (OpenSSH randomart) style deterministic SVG fingerprint.
// Derived from a bytes32 hash. Lightweight, no deps.

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

// 17x9 matches OpenSSH default.
const W = 17
const H = 9

type Pt = { x: number; y: number }

function step(pos: Pt, dir: number): Pt {
  // dir: 0..3 => diagonals like OpenSSH (NW, NE, SW, SE)
  const dx = dir === 0 || dir === 2 ? -1 : 1
  const dy = dir === 0 || dir === 1 ? -1 : 1
  return {
    x: clamp(pos.x + dx, 0, W - 1),
    y: clamp(pos.y + dy, 0, H - 1),
  }
}

export function drunkenBishopSvg(hash: Hash, opts?: { size?: number; padding?: number }): string {
  const size = opts?.size ?? 360
  const padding = opts?.padding ?? 18

  const bytes = hexToBytes(hash)

  // derive a pleasant accent from the first bytes
  const r = clamp(bytes[0] ?? 120, 40, 220)
  const g = clamp(bytes[1] ?? 160, 40, 220)
  const b = clamp(bytes[2] ?? 210, 40, 220)
  const accent = `rgb(${r}, ${g}, ${b})`

  const bg = 'rgba(255,255,255,0.03)'
  const stroke = 'rgba(255,255,255,0.08)'

  // visit counts
  const visits: number[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => 0))

  const start: Pt = { x: Math.floor(W / 2), y: Math.floor(H / 2) }
  let pos: Pt = { ...start }
  visits[pos.y][pos.x]++

  // Each byte encodes 4 moves (2 bits per move) like OpenSSH.
  for (let i = 0; i < bytes.length; i++) {
    const v = bytes[i]
    for (let k = 0; k < 4; k++) {
      const dir = (v >> (k * 2)) & 0x03
      pos = step(pos, dir)
      visits[pos.y][pos.x]++
    }
  }
  const end: Pt = { ...pos }

  // find max visit count for scaling
  let maxV = 0
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) maxV = Math.max(maxV, visits[y][x])
  maxV = Math.max(1, maxV)

  const innerW = size - padding * 2
  const cell = Math.floor(Math.min(innerW / W, innerW / H))
  const gridW = cell * W
  const gridH = cell * H
  const ox = Math.floor((size - gridW) / 2)
  const oy = Math.floor((size - gridH) / 2)

  const cells: string[] = []
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const c = visits[y][x]
      if (c === 0) continue

      const t = c / maxV
      const a = 0.10 + 0.70 * t
      const fill = `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`

      const rx = ox + x * cell
      const ry = oy + y * cell
      cells.push(`<rect x="${rx}" y="${ry}" width="${cell}" height="${cell}" rx="3" fill="${fill}" />`)
    }
  }

  const startCx = ox + start.x * cell + cell / 2
  const startCy = oy + start.y * cell + cell / 2
  const endCx = ox + end.x * cell + cell / 2
  const endCy = oy + end.y * cell + cell / 2

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.9" />
      <stop offset="1" stop-color="${accent}" stop-opacity="0.45" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${size}" height="${size}" rx="18" fill="${bg}" stroke="${stroke}" />
  <rect x="${ox - 10}" y="${oy - 10}" width="${gridW + 20}" height="${gridH + 20}" rx="14" fill="none" stroke="url(#g)" stroke-opacity="0.35" />
  <g>
    ${cells.join('\n    ')}
  </g>
  <!-- start/end markers -->
  <circle cx="${startCx}" cy="${startCy}" r="${Math.max(3, Math.floor(cell / 5))}" fill="rgba(255,255,255,0.55)" />
  <circle cx="${endCx}" cy="${endCy}" r="${Math.max(4, Math.floor(cell / 4))}" fill="${accent}" fill-opacity="0.95" />
</svg>`
}
