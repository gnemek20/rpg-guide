'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { score } from '@/lib/hangul'
import { usePresence } from '@/lib/usePresence'
import { useShallowParam } from '@/lib/useShallowParam'
import { BASE, Icon, ui } from '../ui'
import s from './search.module.css'

export type Entry = { n: string; t: string; h: string; i: string; d?: string }

let cache: Promise<Entry[]> | null = null
const loadIndex = () => (cache ??= fetch(`${BASE}/search.json`).then((r) => r.json()).catch(() => { cache = null; return [] }))

export default function Search() {
  const pathname = usePathname()
  // 검색어는 주소의 ?q= 에 둔다. 새로고침해도 남는다.
  const [q, setQ, ready] = useShallowParam('q')
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState<Entry[] | null>(null)
  const [cursor, setCursor] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const firstPath = useRef(pathname)

  const ensure = () => { if (!index) loadIndex().then(setIndex) }

  // 주소에 검색어가 있는 채로 들어오면 결과를 바로 연다
  useEffect(() => {
    if (ready && q && firstPath.current === pathname) { ensure(); setOpen(true) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  // 다른 페이지로 옮기면 닫는다
  useEffect(() => {
    if (firstPath.current !== pathname) { setOpen(false); firstPath.current = pathname }
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const down = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', down)
    return () => document.removeEventListener('pointerdown', down)
  }, [open])

  // "/" 로 검색창에 바로 들어간다
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(el.tagName)) { e.preventDefault(); input.current?.focus() }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])

  const results = useMemo(() => {
    const k = q.trim()
    if (!index || !k) return []
    return index
      .map((e) => ({ e, sc: Math.max(score(e.n, k), e.d ? score(e.d, k) * 0.4 : 0) }))
      .filter((x) => x.sc > 0)
      .sort((a, b) => b.sc - a.sc || a.e.n.length - b.e.n.length)
      .slice(0, 40)
      .map((x) => x.e)
  }, [index, q])

  useEffect(() => setCursor(0), [q])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); input.current?.blur() }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)) }
    else if (e.key === 'Enter') box.current?.querySelector<HTMLAnchorElement>(`[data-i="${cursor}"]`)?.click()
  }

  const show = open && q.trim().length > 0
  const panel = usePresence(show)
  // 닫히는 동안에는 마지막으로 보이던 결과를 그대로 둔다
  const kept = useRef(results)
  if (show) kept.current = results
  const list = show ? results : kept.current
  return (
    <div className={s.search} ref={box} data-open={show}>
      <label className={ui.field}>
        <Icon shape="search" size={16} />
        <input
          ref={input}
          type="search"
          value={q}
          placeholder="아이템, 몬스터 검색"
          aria-label="검색"
          autoComplete="off"
          enterKeyHint="search"
          onFocus={() => { ensure(); setOpen(true) }}
          onChange={(e) => { setQ(e.target.value); setOpen(true) }}
          onKeyDown={onKey}
        />
        {/* 검색어가 생길 때 입력창 폭이 바뀌지 않게 자리는 항상 차지한다 */}
        <button type="button" className={s.clear} data-on={!!q} tabIndex={q ? 0 : -1} aria-label="검색어 지우기" onClick={() => { setQ(''); input.current?.focus() }}>
          <Icon shape="close" size={16} />
        </button>
      </label>
      {panel.mounted && (
        <div className={s.results} role="listbox" data-shown={panel.shown} onTransitionEnd={panel.onTransitionEnd}>
          {!index ? (
            <span className={s.msg}>불러오는 중입니다.</span>
          ) : list.length === 0 ? (
            <span className={s.msg}>결과가 없습니다.</span>
          ) : (
            list.map((e, i) => (
              <Link key={e.h + e.n + e.t} href={e.h} className={s.item} data-i={i} data-on={i === cursor} role="option" aria-selected={i === cursor} onClick={() => setOpen(false)} onPointerMove={() => setCursor(i)}>
                <svg className="ic" width={16} height={16} viewBox="0 0 16 16" aria-hidden="true"><use href={`${BASE}/gen/icons.svg#${e.i}`} /></svg>
                <span className={s.name}>{e.n}</span>
                {e.d && <span className={s.desc}>{e.d}</span>}
                <span className={ui.chip}>{e.t}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
