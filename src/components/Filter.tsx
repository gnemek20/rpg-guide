'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { score } from '@/lib/hangul'
import { flushUrl, writeUrl } from '@/lib/useShallowParam'
import { Icon, cx, ui } from './ui'

export type TabGroup = { param: string; attr: string; options: { v: string; label: string }[]; all?: string }
type Vals = Record<string, string>

/**
 * 목록 필터. 목록 자체는 서버에서 그린 정적 HTML이고, 여기서는 조건에 안 맞는 항목을 숨기기만 한다.
 * - 항목: [data-k="검색 대상 글자"], 탭 조건은 data-<attr>
 * - 묶음: [data-group] 안에 보이는 항목이 없으면 묶음도 숨긴다
 *
 * 누르는 즉시 바뀌어야 하므로, 숨김 처리는 React 렌더를 기다리지 않고 누른 그 자리에서 바로 한다.
 * 검색어(f)와 탭 값은 주소에 shallow로 남겨 새로고침해도 유지된다.
 */
export default function Filter({ scope, placeholder, groups = [], search = true, unit = '개' }: {
  scope: string; placeholder?: string; groups?: TabGroup[]; search?: boolean; unit?: string
}) {
  const defaults = useRef<Vals>(Object.fromEntries(groups.map((g) => [g.param, g.all ? '' : g.options[0]?.v ?? ''])))
  const [vals, setVals] = useState<Vals>({ f: '', ...defaults.current })
  const valsRef = useRef(vals)
  const countEl = useRef<HTMLSpanElement>(null)
  // 항목과 묶음은 한 번만 찾아 둔다
  const cache = useRef<{ items: { el: HTMLElement; k: string; tags: Record<string, string[]> }[]; groups: HTMLElement[] } | null>(null)

  const apply = useCallback((v: Vals) => {
    if (!cache.current) {
      const root = document.querySelector(scope)
      if (!root) return
      cache.current = {
        items: [...root.querySelectorAll<HTMLElement>('[data-k]')].map((el) => ({
          el, k: el.dataset.k ?? '', tags: Object.fromEntries(groups.map((g) => [g.param, (el.dataset[g.attr] ?? '').split('|')])),
        })),
        groups: [...root.querySelectorAll<HTMLElement>('[data-group]')],
      }
    }
    const q = v.f.trim()
    let n = 0
    for (const it of cache.current.items) {
      let ok = true
      for (const g of groups) {
        const want = v[g.param]
        if (want && !it.tags[g.param].includes(want)) { ok = false; break }
      }
      if (ok && q) ok = score(it.k, q) > 0
      if (it.el.hidden === ok) it.el.hidden = !ok
      if (ok) n++
    }
    for (const el of cache.current.groups) {
      const empty = !el.querySelector('[data-k]:not([hidden])')
      if (el.hidden !== empty) el.hidden = empty
    }
    if (countEl.current) countEl.current.textContent = `${n}${unit}`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, unit])

  useEffect(() => {
    const read = () => {
      const sp = new URLSearchParams(window.location.search)
      const next: Vals = { f: sp.get('f') ?? '' }
      for (const g of groups) next[g.param] = sp.get(g.param) ?? defaults.current[g.param]
      valsRef.current = next
      apply(next)
      setVals(next)
    }
    read()
    // 주소에 #id 가 있으면 필터를 적용한 뒤 그 항목으로 간다
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'center' }))
    window.addEventListener('popstate', read)
    return () => { window.removeEventListener('popstate', read); flushUrl() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apply])

  const set = (key: string, value: string) => {
    const next = { ...valsRef.current, [key]: value }
    valsRef.current = next
    apply(next) // 화면부터 바꾸고
    setVals(next) // 버튼의 눌림 표시를 맞춘 뒤
    writeUrl((url) => { // 주소는 조금 뒤에 조용히 고친다
      if (value && value !== defaults.current[key]) url.searchParams.set(key, value)
      else url.searchParams.delete(key)
    })
  }

  // 마우스는 누르는 순간 바로 바꾼다. 터치는 스크롤하려던 손가락일 수 있으니 뗄 때(click) 바꾼다
  const press = (key: string, value: string) => ({
    onPointerDown: (e: React.PointerEvent) => { if (e.pointerType === 'mouse' && e.button === 0) set(key, value) },
    onClick: () => { if (valsRef.current[key] !== value) set(key, value) },
  })

  return (
    <div className={ui.gap8}>
      {groups.map((g) => (
        <div key={g.param} className={ui.tabs} role="tablist">
          {g.all && <button type="button" className={cx(ui.btn, ui.btnSm)} aria-pressed={!vals[g.param]} {...press(g.param, '')}>{g.all}</button>}
          {g.options.map((o) => (
            <button key={o.v} type="button" className={cx(ui.btn, ui.btnSm)} aria-pressed={vals[g.param] === o.v} {...press(g.param, o.v)}>{o.label}</button>
          ))}
        </div>
      ))}
      {search && (
        <div className={ui.tools}>
          <label className={ui.field}>
            <Icon shape="search" />
            <input type="search" value={vals.f} placeholder={placeholder ?? '이름으로 찾기'} aria-label="목록 필터" autoComplete="off" onChange={(e) => set('f', e.target.value)} />
          </label>
          <span className={ui.count} ref={countEl} />
        </div>
      )}
    </div>
  )
}
