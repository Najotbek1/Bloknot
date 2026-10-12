import { useMemo } from 'react'
import { create } from 'qrcode'

/** A QR code as one SVG path, in the theme's QR colours (dark on light in every theme). */
export function QrCode({ text, label }: { text: string; label: string }) {
  const { size, path } = useMemo(() => {
    const { modules } = create(text, { errorCorrectionLevel: 'M' })
    let d = ''
    for (let row = 0; row < modules.size; row++) {
      for (let col = 0; col < modules.size; col++) {
        if (modules.get(row, col)) d += `M${col} ${row}h1v1h-1z`
      }
    }
    return { size: modules.size, path: d }
  }, [text])
  // A quiet zone of 4 modules around the code, as scanners expect.
  return (
    <svg className="qr" viewBox={`-4 -4 ${size + 8} ${size + 8}`} role="img" aria-label={label} shapeRendering="crispEdges">
      <rect x={-4} y={-4} width={size + 8} height={size + 8} className="qr__bg" />
      <path d={path} className="qr__dots" />
    </svg>
  )
}
