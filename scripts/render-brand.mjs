// Renders the PNG versions of the app icon from docs/brand/maqsad-icon.svg:
// legacy Android launcher icons, the Play Store icon and feature graphic.
// Run: node scripts/render-brand.mjs   (uses the Playwright Chromium from devDependencies)
import { readFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const svg = await readFile('docs/brand/maqsad-icon.svg', 'utf8')
const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
const res = 'android/app/src/main/res'

/** Icon content is drawn for the 66/108 adaptive safe zone; zoom so it fills legacy/Play icons nicely. */
const iconHtml = (size, shape) => `<!doctype html><body style="margin:0;background:transparent">
  <div style="width:${size}px;height:${size}px;overflow:hidden;${shape}">
    <img src="${dataUrl}" style="width:100%;height:100%;display:block;transform:scale(1.35)">
  </div></body>`

const featureHtml = `<!doctype html><body style="margin:0">
  <div style="width:1024px;height:500px;display:flex;align-items:center;gap:56px;padding:0 90px;box-sizing:border-box;
    background:linear-gradient(135deg,#1F2230,#05060A);font-family:system-ui,sans-serif;color:#fff">
    <div style="width:220px;height:220px;border-radius:52px;overflow:hidden;flex:none;box-shadow:0 20px 50px rgba(0,0,0,.5)">
      <img src="${dataUrl}" style="width:100%;height:100%;transform:scale(1.35)">
    </div>
    <div>
      <div style="font-size:92px;font-weight:800;letter-spacing:-1px">Maqsad</div>
      <div style="font-size:34px;opacity:.8;margin-top:8px">Reja, eslatma va bloknot</div>
      <div style="font-size:26px;color:#A5B4FC;margin-top:18px">Kunlik · Haftalik · Oylik · Statistika</div>
    </div>
  </div></body>`

const browser = await chromium.launch()
const page = await browser.newPage()
async function shot(html, width, height, path, omitBackground = true) {
  await page.setViewportSize({ width, height })
  await page.setContent(html)
  await page.waitForTimeout(100)
  await page.screenshot({ path, omitBackground, clip: { x: 0, y: 0, width, height } })
}

const densities = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 }
for (const [density, size] of Object.entries(densities)) {
  await shot(iconHtml(size, `border-radius:${size * 0.22}px`), size, size, `${res}/mipmap-${density}/ic_launcher.png`)
  await shot(iconHtml(size, 'border-radius:50%'), size, size, `${res}/mipmap-${density}/ic_launcher_round.png`)
}
await shot(iconHtml(512, ''), 512, 512, 'docs/play/icon-512.png', false)
await shot(featureHtml, 1024, 500, 'docs/play/feature-graphic-1024x500.png', false)
await browser.close()
console.log('Rendered launcher icons, Play icon and feature graphic.')
