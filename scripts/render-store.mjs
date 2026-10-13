// Renders the Microsoft Store (AppX) tile images from docs/brand/maqsad-icon.svg into
// desktop/build/appx/, where electron-builder picks them up for the Store package.
// Run: node scripts/render-store.mjs   (uses the Playwright Chromium from devDependencies)
import { mkdir, readFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const svg = await readFile('docs/brand/maqsad-icon.svg', 'utf8')
const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
const out = 'desktop/build/appx'
await mkdir(out, { recursive: true })

/** The icon centred on a tile of `width`×`height`, `fill` of the shorter side, on a transparent background. */
const tileHtml = (width, height, fill) => {
  const size = Math.round(Math.min(width, height) * fill)
  return `<!doctype html><body style="margin:0;background:transparent">
  <div style="width:${width}px;height:${height}px;display:grid;place-items:center">
    <div style="width:${size}px;height:${size}px;overflow:hidden;border-radius:${size * 0.22}px">
      <img src="${dataUrl}" style="width:100%;height:100%;display:block;transform:scale(1.35)">
    </div>
  </div></body>`
}

const tiles = [
  ['StoreLogo.png', 50, 50, 1],
  ['Square44x44Logo.png', 44, 44, 1],
  ['SmallTile.png', 71, 71, 0.8],
  ['Square150x150Logo.png', 150, 150, 0.66],
  ['Wide310x150Logo.png', 310, 150, 0.66],
  ['LargeTile.png', 310, 310, 0.6],
]

const browser = await chromium.launch()
const page = await browser.newPage()
for (const [name, width, height, fill] of tiles) {
  await page.setViewportSize({ width, height })
  await page.setContent(tileHtml(width, height, fill))
  await page.waitForTimeout(100)
  await page.screenshot({ path: `${out}/${name}`, omitBackground: true, clip: { x: 0, y: 0, width, height } })
}
await browser.close()
console.log(`Rendered ${tiles.length} Store tiles into ${out}.`)
