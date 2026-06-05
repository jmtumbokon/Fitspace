// Garment swatch gradients — ported from fitspace-hybrid.html (PAL/fab/shade).
// Used as the fallback for pieces without a photo; seeds are derived from ids
// so the same item always renders the same fabric.

export const SWATCH_PALETTE = [
  '#8a9b7e', '#b08968', '#9a8aa8', '#7e93a8',
  '#b5917a', '#85746a', '#a89270', '#6f7a62',
]

function shade(hex: string, amt: number): string {
  const c = hex.replace('#', '')
  const channels = [c.slice(0, 2), c.slice(2, 4), c.slice(4, 6)].map((part) => {
    const value = Math.max(0, Math.min(255, parseInt(part, 16) + amt))
    return value.toString(16).padStart(2, '0')
  })
  return `#${channels.join('')}`
}

export function fabricGradient(color: string, seed: number): string {
  const depth = 20 + (seed % 24)
  return `linear-gradient(${135 + (seed % 40)}deg, ${color} 0%, ${shade(color, -depth)} 100%)`
}

// Deterministic seed from a string id (stable across server/client renders)
export function seedFrom(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) % 997
  }
  return hash
}

export function swatchFor(id: string, offset = 0): string {
  const seed = seedFrom(id) + offset * 5
  return fabricGradient(SWATCH_PALETTE[seed % SWATCH_PALETTE.length], seed)
}
