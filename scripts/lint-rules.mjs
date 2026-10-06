// 디자인 규칙 검사. node scripts/lint-rules.mjs  (빌드 후에는 out/ 의 글자도 검사한다)
// - 가운뎃점, 이모지, 긴 줄표가 화면 글자에 없을 것
// - outline 은 none 만, hover 는 @media (hover: hover) 안에서만
// - grid 레이아웃 없음, border-radius 는 2.5px 이하
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const walk = (dir, exts, out = []) => {
  if (!existsSync(dir)) return out
  for (const n of readdirSync(dir)) {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) { if (n !== 'generated' && n !== '_next') walk(p, exts, out) }
    else if (exts.some((e) => n.endsWith(e))) out.push(p)
  }
  return out
}
const bad = []
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u

for (const f of walk('src', ['.css'])) {
  const css = readFileSync(f, 'utf8')
  let depth = 0, hoverDepth = -1
  css.split('\n').forEach((line, i) => {
    const at = `${f}:${i + 1}`
    if (/@media[^{]*\(hover:\s*hover\)/.test(line)) hoverDepth = depth
    if (/:hover/.test(line) && hoverDepth < 0) bad.push(`${at} hover가 미디어 쿼리 밖에 있음`)
    if (/outline\s*:/.test(line) && !/outline\s*:\s*(none|0)/.test(line)) bad.push(`${at} outline 사용`)
    if (/display\s*:\s*(inline-)?grid/.test(line)) bad.push(`${at} grid 사용`)
    // 효과는 transition 으로만 만든다 (도중에 상태가 바뀌어도 자연스럽게 되돌아가도록)
    if (/@keyframes|^\s*animation(-name)?\s*:/.test(line)) bad.push(`${at} animation 사용`)
    const r = line.match(/border-radius\s*:\s*([\d.]+)px/)
    if (r && Number(r[1]) > 2.5) bad.push(`${at} border-radius ${r[1]}px`)
    depth += (line.match(/{/g) ?? []).length - (line.match(/}/g) ?? []).length
    if (hoverDepth >= 0 && depth <= hoverDepth) hoverDepth = -1
  })
}
for (const f of [...walk('src', ['.tsx']), ...walk('content', ['.md'])]) {
  readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line) || /replace\(|RegExp|\.test\(/.test(line)) return
    if (line.includes('·') && !f.includes('notices')) bad.push(`${f}:${i + 1} 가운뎃점`)
    if (EMOJI.test(line) && !f.includes('notices')) bad.push(`${f}:${i + 1} 이모지`)
  })
}
// 빌드 결과의 화면 글자
let pages = 0
for (const f of walk('out', ['.html'])) {
  pages++
  const text = readFileSync(f, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ')
  const m = text.match(/.{0,12}[·—–→].{0,12}/) ?? text.match(new RegExp(`.{0,12}${EMOJI.source}.{0,12}`, 'u'))
  if (m) bad.push(`${f} 화면 글자: "${m[0].trim()}"`)
}
console.log(`규칙 검사: CSS ${walk('src', ['.css']).length}개, 빌드 페이지 ${pages}개`)
if (bad.length) { bad.slice(0, 40).forEach((b) => console.log('  - ' + b)); console.log(`위반 ${bad.length}건`); process.exit(1) }
console.log('위반 없음')
