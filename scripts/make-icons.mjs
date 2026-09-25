// Draws the app icon as PNG without image libraries; shapes mirror public/favicon.svg.
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const BRAND = [0x0f, 0x76, 0x6e]
const WHITE = [0xff, 0xff, 0xff]
const SAMPLES = 4

const inRoundRect = (x, y, x0, y0, w, h, r) => {
  if (x < x0 || y < y0 || x > x0 + w || y > y0 + h) return false
  const cx = Math.min(Math.max(x, x0 + r), x0 + w - r)
  const cy = Math.min(Math.max(y, y0 + r), y0 + h - r)
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r
}

const inTriangle = (x, y, [ax, ay], [bx, by], [cx, cy]) => {
  const d1 = (x - bx) * (ay - by) - (ax - bx) * (y - by)
  const d2 = (x - cx) * (by - cy) - (bx - cx) * (y - cy)
  const d3 = (x - ax) * (cy - ay) - (cx - ax) * (y - ay)
  const neg = d1 < 0 || d2 < 0 || d3 < 0
  const pos = d1 > 0 || d2 > 0 || d3 > 0
  return !(neg && pos)
}

// Coordinates in a 512 x 512 design space.
function colourAt(x, y, rounded) {
  const inBackground = rounded ? inRoundRect(x, y, 0, 0, 512, 512, 112) : true
  if (!inBackground) return null
  const inLine =
    inRoundRect(x, y, 164, 181, 184, 18, 9) ||
    inRoundRect(x, y, 164, 223, 184, 18, 9) ||
    inRoundRect(x, y, 164, 265, 120, 18, 9)
  if (inLine) return BRAND
  const inBubble = inRoundRect(x, y, 116, 136, 280, 200, 48) || inTriangle(x, y, [176, 320], [176, 396], [250, 320])
  return inBubble ? WHITE : BRAND
}

function render(size, rounded) {
  const scale = 512 / size
  const rows = []
  for (let py = 0; py < size; py++) {
    const row = Buffer.alloc(1 + size * 4)
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const c = colourAt((px + (sx + 0.5) / SAMPLES) * scale, (py + (sy + 0.5) / SAMPLES) * scale, rounded)
          if (c) {
            r += c[0]; g += c[1]; b += c[2]; a += 255
          }
        }
      }
      const n = SAMPLES * SAMPLES
      const alpha = a / n
      const o = 1 + px * 4
      if (alpha > 0) {
        row[o] = Math.round((r / n) * (255 / alpha))
        row[o + 1] = Math.round((g / n) * (255 / alpha))
        row[o + 2] = Math.round((b / n) * (255 / alpha))
      }
      row[o + 3] = Math.round(alpha)
    }
    rows.push(row)
  }
  return png(size, Buffer.concat(rows))
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buf) {
  let c = 0xffffffff
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function png(size, raw) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8 // bit depth
  header[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const out = new URL('../public/', import.meta.url)
writeFileSync(new URL('icon-192.png', out), render(192, true))
writeFileSync(new URL('icon-512.png', out), render(512, true))
writeFileSync(new URL('icon-maskable-512.png', out), render(512, false))
console.log('Icons written to public/')
