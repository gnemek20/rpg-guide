'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { score } from '@/lib/hangul'
import { Icon, cx, ui } from './ui'

export type TabGroup = { param: string; attr: string; options: { v: string; label: string }[]; all?: string }

/**
 * 목록 필터. 목록 자체는 서버에서 그린 정적 HTML이고, 여기서는 조건에 안 맞는 항목을 숨기기만 한다.
 * - 항목: [data-k="검색 대상 글자"], 탭 조건은 data-<attr>
 * - 묶음: [data-group] 안에 보이는 항목이 없으면 묶음도 숨긴다
 * 검색어(f)와 탭 값은 주소에 shallow로 남겨 새로고침해도 유지된다.
 */
export default function Filter({ scope, placeholder, groups = [], search = true, unit = '개' }: {
  scope: string; placeholder?: string; groups?: TabGroup[]; search?: boolean; unit?: string
}) {
  const defaults = useRef(Object.fromEntries(groups.map((g) => [g.param, g.all ? '' : g.options[0]?.v ?? ''])))
  const [vals, setVals] = useState<Record<string, string>>({ f: '', ...defaults.current })
  const [count, setCount] = useState<number | null>(null)
  const ready = useRef(false)

  useEffect(() => {
    const read = () => {
      const sp = new URLSearchParams(window.location.search)
      const next: Record<string, string> = { f: sp.get('f') ?? '' }
      for (const g of groups) next[g.param] = sp.get(g.param) ?? defaults.current[g.param]
      setVals(next)
    }
    read()
    window.addEventListener('popstate', read)
    return () => window.removeEventListener('popstate', read)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const set = useCallback((key: string, value: string) => {
    setVals((v) => ({ ...v, [key]: value }))
    const url = new URL(window.location.href)
    if (value && value !== defaults.current[key]) url.searchParams.set(key, value)
    else url.searchParams.delete(key)
    window.history.replaceState(null, '', url)
  }, [])

  useEffect(() => {
    const root = document.querySelector(scope)
    if (!root) return
    const q = vals.f.trim()
    let n = 0
    root.querySelectorAll<HTMLElement>('[data-k]').forEach((el) => {
      let ok = !q || score(el.dataset.k ?? '', q) > 0
      for (const g of groups) {
        const want = vals[g.param]
        if (ok && want) ok = (el.dataset[g.attr] ?? '').split('|').includes(want)
      }
      el.hidden = !ok
      if (ok) n++
    })
    root.querySelectorAll<HTMLElement>('[data-group]').forEach((el) => {
      el.hidden = !el.querySelector('[data-k]:not([hidden])')
    })
    setCount(n)
    // 주소에 #id 가 있으면 필터를 적용한 뒤 그 항목으로 간다
    if (!ready.current) {
      ready.current = true
      const id = decodeURIComponent(window.location.hash.slice(1))
      if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'center' }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vals, scope])

  return (
    <div className={ui.gap8}>
      {groups.map((g) => (
        <div key={g.param} className={ui.tabs} role="tablist">
          {g.all && <button type="button" className={cx(ui.btn, ui.btnSm)} aria-pressed={!vals[g.param]} onClick={() => set(g.param, '')}>{g.all}</button>}
          {g.options.map((o) => (
            <button key={o.v} type="button" className={cx(ui.btn, ui.btnSm)} aria-pressed={vals[g.param] === o.v} onClick={() => set(g.param, o.v)}>{o.label}</button>
          ))}
        </div>
      ))}
      {search && (
        <div className={ui.tools}>
          <label className={ui.field}>
            <Icon shape="search" />
            <input type="search" value={vals.f} placeholder={placeholder ?? '이름으로 찾기'} aria-label="목록 필터" autoComplete="off" onChange={(e) => set('f', e.target.value)} />
          </label>
          <span className={ui.count}>{count === null ? '' : `${count}${unit}`}</span>
        </div>
      )}
    </div>
  )
}
