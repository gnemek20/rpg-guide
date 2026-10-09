// content/ 의 마크다운 로더. 빌드 때만 실행된다.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { plain } from './markdown'

export type Doc = { slug: string; title: string; lead?: string; body: string; file: string; date?: string }

/**
 * 글자 정리: 가운뎃점, 긴 줄표, 화살표를 쉼표, 붙임표, 부등호로 바꾼다.
 * 파일을 읽는 자리에서 한 번에 바꿔 두므로 제목, 표 머리글 어디에 쓰여 있어도 화면에 그대로 나가지 않는다.
 */
const tidy = (s: string) => s.replace(/[ \t]*·[ \t]*/g, ', ').replace(/[ \t]*[—–][ \t]*/g, ' - ').replace(/[ \t]*→[ \t]*/g, ' > ')

function parseDoc(file: string, dir: string): Omit<Doc, 'slug'> {
  const lines = tidy(readFileSync(join(process.cwd(), 'content', dir, file), 'utf8').replace(/\r\n/g, '\n')).split('\n')
  let title = file.replace(/\.md$/, '')
  let lead: string | undefined
  let i = 0
  while (i < lines.length && !lines[i].trim()) i++
  if (lines[i]?.startsWith('# ')) title = lines[i++].slice(2).trim()
  while (i < lines.length && !lines[i].trim()) i++
  if (lines[i]?.startsWith('> ')) {
    const buf: string[] = []
    while (lines[i]?.startsWith('>')) buf.push(lines[i++].replace(/^>\s?/, ''))
    lead = buf.join(' ')
  }
  return { title: plain(title), lead, body: lines.slice(i).join('\n'), file }
}
const list = (dir: string) => readdirSync(join(process.cwd(), 'content', dir)).filter((f) => f.endsWith('.md') && !f.startsWith('_')).sort()

/** 가이드: content/guide/NN-slug.md. 파일 이름 순서가 곧 목차 순서 */
export function guides(): Doc[] {
  return list('guide').map((f) => ({ ...parseDoc(f, 'guide'), slug: f.replace(/^\d+-/, '').replace(/\.md$/, '') }))
}

/**
 * 공지: content/notices/날짜-제목.md. 파일을 넣기만 하면 목록에 붙는다.
 * '_'로 시작하는 파일은 양식이라 건너뛴다. 주소는 날짜로 만들고, 같은 날 여러 건이면 번호를 붙인다.
 */
export function notices(): Doc[] {
  const used = new Map<string, number>()
  const docs = list('notices').map((f, idx) => {
    const date = f.match(/^(\d{4}-\d{2}-\d{2})/)?.[1]
    const base = date ?? `n${idx + 1}`
    const n = (used.get(base) ?? 0) + 1
    used.set(base, n)
    return { ...parseDoc(f, 'notices'), slug: n > 1 ? `${base}-${n}` : base, date }
  })
  return docs.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || b.file.localeCompare(a.file))
}

/** 예전 사이트 방식의 링크(items.html, g-도전.html)를 새 주소로 바꾼다. */
const LEGACY: Record<string, string> = {
  'index.html': '/', 'notices.html': '/notices/', 'systems.html': '/guide/', 'items.html': '/items/', 'spells.html': '/spells/',
  'fishing.html': '/fishing/', 'island.html': '/island/', 'monsters.html': '/monsters/',
  'g-시작하기.html': '/guide/start/', 'g-성장.html': '/guide/growth/', 'g-섬.html': '/guide/island/', 'g-낚시.html': '/guide/fishing/',
  'g-장비.html': '/guide/gear/', 'g-마법.html': '/guide/magic/', 'g-경제.html': '/guide/economy/', 'g-도전.html': '/guide/challenge/',
  'g-이용규칙.html': '/guide/rules/',
}
export function resolveHref(href: string): string {
  const [path, hash] = href.split('#')
  const hit = LEGACY[decodeURIComponent(path)]
  return hit ? hit + (hash ? `#${hash}` : '') : href
}
