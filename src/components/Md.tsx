import Link from 'next/link'
import { marked, type Token, type Tokens } from 'marked'
import type { ReactNode } from 'react'
import { resolveHref } from '@/lib/content'
import { Panel, Table, cx, ui } from './ui'
import s from './md.module.css'

/** 본문 글자 정리: 가운뎃점, 긴 줄표, 화살표를 쉼표, 붙임표, 부등호로 바꾼다. 앞뒤 공백은 그대로 둔다. */
const soften = (t: string) =>
  t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s*·\s*/g, ', ').replace(/\s*[—–]\s*/g, ' - ').replace(/\s*→\s*/g, ' > ')

function inline(tokens: Token[] | undefined): ReactNode[] {
  return (tokens ?? []).map((t, i) => {
    switch (t.type) {
      case 'strong': return <strong key={i}>{inline(t.tokens)}</strong>
      case 'em': return <em key={i} className={s.em}>{inline(t.tokens)}</em>
      case 'codespan': return <code key={i}>{soften(t.text)}</code>
      case 'br': return <br key={i} />
      case 'html': return /^<br\s*\/?>$/i.test(t.raw.trim()) ? <br key={i} /> : null
      case 'link': {
        const href = resolveHref(t.href)
        return href.startsWith('/') ? <Link key={i} href={href} className={s.a}>{inline(t.tokens)}</Link> : <a key={i} href={href} className={s.a} rel="noreferrer">{inline(t.tokens)}</a>
      }
      case 'text': return 'tokens' in t && t.tokens ? <span key={i}>{inline(t.tokens)}</span> : soften(t.text)
      default: return 'text' in t ? soften(String(t.text)) : null
    }
  })
}

function block(t: Token, i: number): ReactNode {
  switch (t.type) {
    case 'heading': return t.depth <= 2 ? <h2 key={i} className={s.h2}>{inline(t.tokens)}</h2> : <h3 key={i} className={ui.sub}>{inline(t.tokens)}</h3>
    case 'paragraph': return <p key={i} className={s.p}>{inline(t.tokens)}</p>
    case 'blockquote': return <div key={i} className={ui.note}>{(t.tokens ?? []).map(block)}</div>
    case 'list': {
      const l = t as Tokens.List
      return (
        <ul key={i} className={s.list}>
          {l.items.map((it, j) => (
            <li key={j} className={s.li}>
              <span className={s.bullet}>{l.ordered ? `${Number(l.start || 1) + j}` : '-'}</span>
              <div className={s.liBody}>{it.tokens.map((x, k) => (x.type === 'text' ? <p key={k} className={s.p}>{inline((x as Tokens.Text).tokens ?? [x])}</p> : block(x, k)))}</div>
            </li>
          ))}
        </ul>
      )
    }
    case 'table': {
      const tb = t as Tokens.Table
      return (
        <Table
          key={i}
          cols={tb.header.map((h, j) => ({ label: h.text.replace(/\*\*/g, ''), main: j === 0, w: j === 0 ? 1 : 2 }))}
          rows={tb.rows.map((r) => r.map((c) => <p className={s.p}>{inline(c.tokens)}</p>))}
        />
      )
    }
    case 'space': case 'hr': return null
    default: return 'text' in t ? <p key={i} className={s.p}>{soften(String(t.text))}</p> : null
  }
}

/** 마크다운 본문. '## 제목' 마다 패널 하나로 끊는다. */
export default function Md({ src, tex }: { src: string; tex?: string }) {
  const tokens = marked.lexer(src)
  const sections: { title?: ReactNode; id?: string; items: Token[] }[] = [{ items: [] }]
  for (const t of tokens) {
    if (t.type === 'heading' && t.depth <= 2) sections.push({ title: inline(t.tokens), id: sectionId(t.text), items: [] })
    else sections[sections.length - 1].items.push(t)
  }
  return (
    <>
      {sections.filter((sec) => sec.title || sec.items.some((x) => x.type !== 'space')).map((sec, i) => (
        <Panel key={i} title={sec.title} id={sec.id} tex={i === 0 ? tex : undefined} className={cx(s.md)}>
          {sec.items.map(block)}
        </Panel>
      ))}
    </>
  )
}
export const sectionId = (text: string) => 's-' + text.replace(/[`*()\[\]]/g, '').trim().replace(/\s+/g, '-')
export function tocOf(src: string): { id: string; label: string }[] {
  return marked.lexer(src).filter((t): t is Tokens.Heading => t.type === 'heading' && t.depth === 2).map((t) => ({ id: sectionId(t.text), label: soften(t.text.replace(/[`*]/g, '')) }))
}
