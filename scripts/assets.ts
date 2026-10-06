// 빌드 전 에셋 생성: 블록 텍스처, 아이콘 스프라이트, 글꼴 서브셋.
// 같은 입력이면 항상 같은 결과가 나오도록 난수는 고정 시드만 쓴다.
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { PNG } from 'pngjs'
import subsetFont from 'subset-font'
import { parse } from 'yaml'
import { MATERIALS, SHAPES, UI_ICONS, POTION_MATS, iconFor, iconId, segments } from '../src/lib/pixel/shapes'

const GEN = 'src/generated'
const PUB = 'public/gen'
mkdirSync(join(PUB, 'fonts'), { recursive: true })
mkdirSync(PUB, { recursive: true })

// ---------------------------------------------------------------- 텍스처
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
type RGB = [number, number, number, number?]
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
type Grid = RGB[][]
const S = 16
const make = (fn: (x: number, y: number) => RGB): Grid =>
  Array.from({ length: S }, (_, y) => Array.from({ length: S }, (_, x) => fn(x, y)))

/** 팔레트에서 가중치로 고르는 잡음 */
function noise(seed: number, colors: string[], weights: number[]): Grid {
  const r = rng(seed)
  const total = weights.reduce((a, b) => a + b, 0)
  const pal = colors.map(hex)
  return make(() => {
    let v = r() * total
    for (let i = 0; i < pal.length; i++) {
      v -= weights[i]
      if (v <= 0) return pal[i]
    }
    return pal[0]
  })
}
/** 가로로 이어지는 결 (돌, 심층암) */
function streak(seed: number, colors: string[], run = 3): Grid {
  const r = rng(seed)
  const pal = colors.map(hex)
  const g: Grid = []
  for (let y = 0; y < S; y++) {
    const row: RGB[] = []
    let c = pal[Math.floor(r() * pal.length)]
    for (let x = 0; x < S; x++) {
      if (r() < 1 / run) c = pal[Math.floor(r() * pal.length)]
      row.push(c)
    }
    g.push(row)
  }
  return g
}
function planks(seed: number, base: string, light: string, dark: string, seam: string): Grid {
  const r = rng(seed)
  const [b, l, d, s] = [base, light, dark, seam].map(hex)
  return make((x, y) => {
    const board = Math.floor(y / 4)
    if (y % 4 === 3) return s
    const cut = [5, 12, 2, 9][board]
    if (x === cut) return s
    const v = r()
    return v < 0.18 ? l : v < 0.34 ? d : b
  })
}
function bricks(seed: number, base: string[], mortar: string, h = 4, w = 8): Grid {
  const r = rng(seed)
  const pal = base.map(hex)
  const m = hex(mortar)
  return make((x, y) => {
    const row = Math.floor(y / h)
    const off = row % 2 ? w / 2 : 0
    if (y % h === h - 1 || (x + off) % w === w - 1) return m
    return pal[Math.floor(r() * pal.length)]
  })
}
function cobble(seed: number): Grid {
  const r = rng(seed)
  const pts = Array.from({ length: 9 }, () => [r() * S, r() * S, 0.75 + r() * 0.5])
  const shades = ['#9a9a9a', '#868686', '#7a7a7a', '#a6a6a6'].map(hex)
  const edge = hex('#555555')
  return make((x, y) => {
    let best = 1e9, second = 1e9, bi = 0
    pts.forEach(([px, py, wgt], i) => {
      // 타일이 이어지도록 감싸서 거리 계산
      const dx = Math.min(Math.abs(x - px), S - Math.abs(x - px))
      const dy = Math.min(Math.abs(y - py), S - Math.abs(y - py))
      const d = Math.hypot(dx, dy) * wgt
      if (d < best) { second = best; best = d; bi = i } else if (d < second) second = d
    })
    if (second - best < 0.9) return edge
    return shades[(bi + (r() < 0.2 ? 1 : 0)) % shades.length]
  })
}
function grassSide(seed: number, dirt: Grid, top: Grid): Grid {
  const r = rng(seed)
  const depth = Array.from({ length: S }, () => 2 + Math.floor(r() * 3))
  return make((x, y) => (y < depth[x] ? top[y][x] : dirt[y][x]))
}
function water(seed: number): Grid {
  const r = rng(seed)
  const base = hex('#2f63c8'), mid = hex('#3d74d8'), hi = hex('#5b8fe8'), deep = hex('#2855b0')
  return make((x, y) => {
    const wave = Math.sin((x + y * 0.5) * 0.8) + Math.sin((x * 0.3 - y) * 0.9)
    if (wave > 1.2) return hi
    if (wave > 0.4) return mid
    if (wave < -1.3) return deep
    return r() < 0.08 ? mid : base
  })
}
function log(seed: number, colors: string[]): Grid {
  const r = rng(seed)
  const pal = colors.map(hex)
  const cols = Array.from({ length: S }, () => Math.floor(r() * pal.length))
  return make((x) => (r() < 0.25 ? pal[Math.floor(r() * pal.length)] : pal[cols[x]]))
}
function ore(seed: number, stone: Grid, gem: string, gemLight: string): Grid {
  const r = rng(seed)
  const g = stone.map((row) => row.slice())
  const [a, b] = [hex(gem), hex(gemLight)]
  for (let i = 0; i < 6; i++) {
    const cx = 2 + Math.floor(r() * 12), cy = 2 + Math.floor(r() * 12)
    g[cy][cx] = b
    g[cy][cx + 1] = a
    g[cy + 1][cx] = a
    if (r() < 0.5) g[cy + 1][cx + 1] = a
  }
  return g
}

const dirt = noise(11, ['#866043', '#79553a', '#966c4a', '#593d29', '#b9855c'], [40, 28, 18, 10, 4])
const grassTop = noise(12, ['#6aa84a', '#5e9a40', '#77b556', '#528a37'], [40, 28, 18, 14])
const stone = streak(13, ['#7d7d7d', '#747474', '#8a8a8a', '#6c6c6c'], 3)
const TEX: Record<string, Grid> = {
  dirt,
  grass_top: grassTop,
  grass_side: grassSide(14, dirt, grassTop),
  stone,
  cobble: cobble(15),
  planks: planks(16, '#a8875a', '#b8976a', '#97784e', '#6f5a36'),
  dark_planks: planks(17, '#6b4f2f', '#7a5c38', '#5c4326', '#3e2c17'),
  log: log(18, ['#6b5332', '#5c4729', '#7a6040', '#4e3c22']),
  leaves: noise(19, ['#3f7a2a', '#356a22', '#4a8a33', '#27531a'], [34, 28, 20, 18]),
  cherry: noise(20, ['#f1b3cf', '#e79ac0', '#f8cfe1', '#d882ad'], [36, 26, 22, 16]),
  deepslate: streak(21, ['#4f4f52', '#454548', '#5a5a5e', '#3a3a3d'], 4),
  deep_bricks: bricks(22, ['#515155', '#48484c', '#5a5a5e'], '#2b2b2e'),
  stone_bricks: bricks(23, ['#7f7f7f', '#767676', '#888888'], '#565656'),
  sand: noise(24, ['#dbcfa3', '#d5c798', '#e3d9b0', '#c9ba88'], [40, 28, 20, 12]),
  gravel: noise(25, ['#857f7c', '#6f6a67', '#9a9591', '#5a5653'], [34, 26, 22, 18]),
  obsidian: noise(26, ['#15101f', '#0f0b17', '#241b36', '#3b2a57'], [44, 30, 18, 8]),
  netherrack: noise(27, ['#6f3535', '#5a2828', '#854242', '#4b1f1f'], [38, 28, 18, 16]),
  water: water(28),
  lava: noise(29, ['#d4610c', '#f79a1f', '#e7430f', '#fbd24a'], [38, 28, 24, 10]),
  glow: noise(30, ['#f0c860', '#e0a840', '#fff0b0', '#b08a30'], [36, 26, 22, 16]),
  coal_ore: ore(31, stone, '#2a2a2a', '#3e3e3e'),
  iron_ore: ore(32, stone, '#c9a585', '#e0c2a6'),
  gold_ore: ore(33, stone, '#f2c13c', '#fff38a'),
  diamond_ore: ore(34, stone, '#4fd9c8', '#b6fff4'),
  mycelium: noise(35, ['#6f6369', '#7d7078', '#5f545a', '#8a7c85'], [36, 28, 20, 16]),
  red_sand: noise(36, ['#be6621', '#b25c1b', '#ca7430', '#a35116'], [40, 28, 20, 12]),
  wool_red: noise(37, ['#a12722', '#96231f', '#ad2e28'], [50, 28, 22]),
  wool_white: noise(38, ['#e9ecec', '#dfe2e2', '#f4f6f6'], [50, 28, 22]),
}

/**
 * 요철 굽기. 칸마다 높이를 정하고(밝은 칸이 튀어나옴 + 고정 잡음),
 * 이웃보다 높은 쪽 모서리는 밝게, 낮은 쪽 모서리와 그림자가 지는 쪽은 어둡게 칠한다.
 * 빛은 왼쪽 위에서 온다. 결과는 한 칸을 4x4로 키운 64px 타일.
 */
const K = 4
function relief(g: Grid, seed: number, strength = 1): Grid {
  const r = rng(seed * 977 + 5)
  const lum = (c: RGB) => c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11
  const ls = g.flat().map(lum)
  const lo = Math.min(...ls), span = Math.max(...ls) - lo || 1
  // 높이 0..3
  const h = g.map((row) => row.map((c) => Math.round(((lum(c) - lo) / span) * 2 + r() * 1.2)))
  const at = (x: number, y: number) => h[(y + S) % S][(x + S) % S]
  const shade = (c: RGB, k: number): RGB => [0, 1, 2].map((i) => Math.max(0, Math.min(255, Math.round((c[i] ?? 0) * (1 + k))))) as RGB
  const out: Grid = []
  for (let y = 0; y < S * K; y++) {
    const row: RGB[] = []
    for (let x = 0; x < S * K; x++) {
      const tx = Math.floor(x / K), ty = Math.floor(y / K), sx = x % K, sy = y % K
      const me = at(tx, ty)
      let k = (me - 1.5) * 0.045 // 높은 칸은 전체가 살짝 밝다
      const up = at(tx, ty - 1) - me, left = at(tx - 1, ty) - me
      const down = at(tx, ty + 1) - me, right = at(tx + 1, ty) - me
      if (sy === 0) k += up < 0 ? 0.2 : up > 0 ? -0.26 : 0
      if (sx === 0) k += left < 0 ? 0.14 : left > 0 ? -0.2 : 0
      if (sy === K - 1 && down < 0) k -= 0.2
      if (sx === K - 1 && right < 0) k -= 0.14
      // 위, 왼쪽 칸이 더 높으면 그림자가 한 줄 더 내려온다
      if (sy === 1 && up > 1) k -= 0.12
      if (sx === 1 && left > 1) k -= 0.08
      row.push(shade(g[ty][tx], k * strength))
    }
    out.push(row)
  }
  return out
}

function toPng(g: Grid, scale = 1): Buffer {
  const S = g.length
  const png = new PNG({ width: S * scale, height: S * scale })
  for (let y = 0; y < S * scale; y++)
    for (let x = 0; x < S * scale; x++) {
      const [r, gg, b, a] = g[Math.floor(y / scale)][Math.floor(x / scale)]
      const i = (y * S * scale + x) * 4
      png.data[i] = r; png.data[i + 1] = gg; png.data[i + 2] = b; png.data[i + 3] = a ?? 255
    }
  return PNG.sync.write(png, { deflateLevel: 9 })
}

// 물, 용암, 양털은 평평하게 두고 나머지는 요철을 굽는다.
const FLAT = new Set(['water', 'lava', 'wool_red', 'wool_white'])
const SOFT = new Set(['planks', 'dark_planks', 'sand', 'red_sand', 'leaves', 'cherry'])
const BAKED: Record<string, Grid> = {}
Object.entries(TEX).forEach(([name, g], i) => {
  BAKED[name] = FLAT.has(name) ? g : relief(g, i + 1, SOFT.has(name) ? 0.6 : 1)
})

const uris: Record<string, string> = {}
for (const [name, g] of Object.entries(BAKED)) uris[name] = `data:image/png;base64,${toPng(g).toString('base64')}`
// 높이 값도 같이 내보낸다. 가까운 블록은 WebGL에서 칸마다 실제로 돌출시킨다.
writeFileSync(join(GEN, 'textures.ts'), `// 자동 생성. scripts/assets.ts\nexport const TEXTURES: Record<string, string> = ${JSON.stringify(uris, null, 1)}\n`)
// CSS에서 쓰는 텍스처만 변수로 내보낸다.
const CSS_TEX = ['dirt', 'grass_side', 'grass_top', 'stone', 'cobble', 'planks', 'dark_planks', 'deepslate', 'deep_bricks', 'stone_bricks', 'water', 'sand', 'obsidian', 'log']
writeFileSync(
  join(GEN, 'textures.css'),
  `/* 자동 생성. scripts/assets.ts */\n:root {\n${CSS_TEX.map((k) => `  --tex-${k.replace(/_/g, '-')}: url(${uris[k]});`).join('\n')}\n}\n`,
)
// 가까이 놓는 블록용 원본 16x16 색 (칸 단위 돌출에 사용)
const rawOf = (n: string) => TEX[n].map((row) => row.map(([r, g, b]) => (r << 16) | (g << 8) | b))
writeFileSync(join(GEN, 'voxels.ts'), `// 자동 생성. scripts/assets.ts\nexport const RAW: Record<string, number[][]> = ${JSON.stringify({ dirt: rawOf('dirt'), grass_top: rawOf('grass_top'), grass_side: rawOf('grass_side'), stone: rawOf('stone'), deepslate: rawOf('deepslate') })}\n`)

// ---------------------------------------------------------------- 아이콘
for (const [name, rows] of Object.entries(SHAPES)) {
  if (rows.length !== 16) throw new Error(`아이콘 ${name}: 행 수 ${rows.length}`)
  rows.forEach((r, i) => { if (r.length !== 16) throw new Error(`아이콘 ${name} ${i}행: 길이 ${r.length}`) })
}

const wanted = new Map<string, [string, string]>()
const want = (shape: string, mat: string) => wanted.set(iconId(shape, mat), [shape, mat])
for (const [shape, mat] of UI_ICONS) want(shape, mat)
for (const m of POTION_MATS) want('potion', m)
// 데이터 안의 마인크래프트 아이템 이름을 전부 훑는다.
const walk = (v: unknown) => {
  if (typeof v === 'string') { if (/^[A-Z][A-Z0-9_]{2,}$/.test(v)) want(...iconFor(v)) }
  else if (Array.isArray(v)) v.forEach(walk)
  else if (v && typeof v === 'object') Object.values(v).forEach(walk)
}
for (const f of readdirSync('data').filter((f) => f.endsWith('.yml')).sort()) walk(parse(readFileSync(join('data', f), 'utf8')))

const symbols = [...wanted.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([id, [shape, mat]]) => {
  const byColor = new Map<string, string>()
  for (const s of segments(shape, mat)) byColor.set(s.c, (byColor.get(s.c) ?? '') + `M${s.x} ${s.y}h${s.w}v1h-${s.w}z`)
  const paths = [...byColor.entries()].map(([c, d]) => `<path fill="${c}" d="${d}"/>`).join('')
  return `<symbol id="${id}" viewBox="0 0 16 16">${paths}</symbol>`
})
writeFileSync(join(PUB, 'icons.svg'), `<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">${symbols.join('')}</svg>\n`)

// 확인용 모음 시트. SHEET=1 일 때만 shots/ 에 만든다 (배포물에는 넣지 않음)
if (process.env.SHEET) {
  mkdirSync('shots', { recursive: true })
  const names = Object.keys(SHAPES)
  const cols = 12, cell = 18, scale = 3
  const rowsN = Math.ceil(names.length / cols)
  const png = new PNG({ width: cols * cell * scale, height: rowsN * cell * scale })
  png.data.fill(0x50)
  for (let i = 3; i < png.data.length; i += 4) png.data[i] = 255
  const mats = ['iron', 'diamond', 'gold', 'red', 'green', 'purple']
  names.forEach((n, i) => {
    const ox = (i % cols) * cell + 1, oy = Math.floor(i / cols) * cell + 1
    for (const s of segments(n, mats[i % mats.length])) {
      const [r, g, b] = hex(s.c)
      for (let dx = 0; dx < s.w * scale; dx++)
        for (let dy = 0; dy < scale; dy++) {
          const p = (((oy + s.y) * scale + dy) * png.width + (ox + s.x) * scale + dx) * 4
          png.data[p] = r; png.data[p + 1] = g; png.data[p + 2] = b
        }
    }
  })
  writeFileSync(join('shots', '_icons-sheet.png'), PNG.sync.write(png))
  const tn = Object.keys(TEX)
  const tp = new PNG({ width: tn.length * 66, height: 64 })
  tn.forEach((n, i) => {
    const one = PNG.sync.read(toPng(BAKED[n], BAKED[n].length === 16 ? 4 : 1))
    PNG.bitblt(one, tp, 0, 0, 64, 64, i * 66, 0)
  })
  writeFileSync(join('shots', '_tex-sheet.png'), PNG.sync.write(tp))
}

// ---------------------------------------------------------------- 글꼴
// 사이트에 실제로 나오는 글자만 남긴다. data, content, src를 훑는다.
const chars = new Set<string>()
for (let c = 0x20; c < 0x7f; c++) chars.add(String.fromCharCode(c))
'·—–→←↑↓×÷√±≥≤…’‘“”※「」『』~°%'.split('').forEach((c) => chars.add(c))
// 검색창 입력 대비: 한글 자모
for (let c = 0x3131; c <= 0x3163; c++) chars.add(String.fromCharCode(c))
const scan = (dir: string) => {
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) { if (name !== 'generated') scan(p) }
    else if (/\.(yml|md|ts|tsx|css)$/.test(name)) for (const ch of readFileSync(p, 'utf8')) chars.add(ch)
  }
}
;['data', 'content', 'src'].forEach(scan)
const text = [...chars].filter((c) => c >= ' ').sort().join('')

const FONTS: [string, string, number][] = [
  ['Galmuri11', 'Galmuri11.ttf', 400],
  ['Galmuri11', 'Galmuri11-Bold.ttf', 700],
  ['Galmuri14', 'Galmuri14.ttf', 400],
  ['Galmuri9', 'Galmuri9.ttf', 400],
]
const faces: { family: string; file: string; weight: number; v: string }[] = []
for (const [family, file, weight] of FONTS) {
  const src = readFileSync(join('node_modules/galmuri/dist', file))
  const out = await subsetFont(src, text, { targetFormat: 'woff2' })
  const outName = file.replace('.ttf', '.woff2')
  writeFileSync(join(PUB, 'fonts', outName), out)
  // 내용이 바뀌면 주소도 바뀌게 해시를 붙인다
  faces.push({ family, file: outName, weight, v: createHash('sha1').update(out).digest('hex').slice(0, 8) })
  console.log(`글꼴 ${outName}: ${(out.length / 1024).toFixed(1)}KB (${text.length}자)`)
}
// 글꼴은 레이아웃에서 미리 받기(preload)로 걸기 때문에 주소 목록만 내보낸다
writeFileSync(join(GEN, 'fonts.ts'), `// 자동 생성. scripts/assets.ts\nexport const FONTS = ${JSON.stringify(faces, null, 1)}\n`)
console.log(`텍스처 ${Object.keys(TEX).length}종, 아이콘 ${symbols.length}종 생성`)
void MATERIALS
