import type { Heading, PhrasingContent, RootContent } from 'mdast'
import type { ReactNode } from 'react'
import { mathBlock, parse, phrasing, textOf } from '@/lib/markdown'
import { Panel, Table, cx, ui } from './ui'
import s from './md.module.css'

const inline = (nodes: PhrasingContent[]) => phrasing(nodes)

function block(t: RootContent, i: number): ReactNode {
  switch (t.type) {
    case 'heading': return t.depth <= 2 ? <h2 key={i} className={s.h2}>{inline(t.children)}</h2> : <h3 key={i} className={ui.sub}>{inline(t.children)}</h3>
    case 'paragraph': return <p key={i} className={s.p}>{inline(t.children)}</p>
    case 'blockquote': return <div key={i} className={ui.note}>{t.children.map(block)}</div>
    case 'list':
      return (
        <ul key={i} className={s.list}>
          {t.children.map((it, j) => (
            <li key={j} className={s.li}>
              <span className={s.bullet}>{t.ordered ? `${(t.start ?? 1) + j}` : '-'}</span>
              <div className={s.liBody}>{it.children.map(block)}</div>
            </li>
          ))}
        </ul>
      )
    case 'table': {
      const [head, ...rows] = t.children
      return (
        <Table
          key={i}
          cols={head.children.map((h, j) => ({ label: textOf(h.children).trim(), main: j === 0, w: j === 0 ? 1 : 2 }))}
          rows={rows.map((r) => r.children.map((c) => <p className={s.p}>{inline(c.children)}</p>))}
        />
      )
    }
    case 'math': return <div key={i} className={s.math}>{mathBlock(t)}</div>
    case 'code': return <p key={i} className={s.p}><code>{t.value}</code></p>
    case 'html': return /^<br/i.test(t.value) ? null : <p key={i} className={s.p}>{t.value}</p>
    default: return null
  }
}

/** 마크다운 본문. '## 제목' 마다 패널 하나로 끊는다. */
export default function Md({ src, tex }: { src: string; tex?: string }) {
  const sections: { title?: ReactNode; id?: string; items: RootContent[] }[] = [{ items: [] }]
  for (const t of parse(src).children) {
    if (t.type === 'heading' && t.depth <= 2) sections.push({ title: inline(t.children), id: sectionId(textOf(t.children)), items: [] })
    else sections[sections.length - 1].items.push(t)
  }
  return (
    <>
      {sections.filter((sec) => sec.title || sec.items.length).map((sec, i) => (
        <Panel key={i} title={sec.title} id={sec.id} tex={i === 0 ? tex : undefined} className={cx(s.md)}>
          {sec.items.map(block)}
        </Panel>
      ))}
    </>
  )
}
export const sectionId = (text: string) => 's-' + text.replace(/[`*()\[\]]/g, '').trim().replace(/\s+/g, '-')
export function tocOf(src: string): { id: string; label: string }[] {
  return parse(src).children.filter((t): t is Heading => t.type === 'heading' && t.depth === 2).map((t) => ({ id: sectionId(textOf(t.children)), label: textOf(t.children) }))
}
