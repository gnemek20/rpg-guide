'use client'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { score } from '@/lib/hangul'
import { usePresence } from '@/lib/usePresence'
import { useShallowParam } from '@/lib/useShallowParam'
import { BASE, Icon, cx, ui } from '../ui'
import s from './board.module.css'

export type BNode = { id: string; x: number; y: number; ic: string; name: string; label?: boolean; tone?: string }
export type BDetail = {
  /** desc 와 rows 의 text 는 빌드 때 만든 HTML 이다 (마크다운 적용) */
  chips?: string[]; stats?: string[]; desc?: string[]; href?: string
  sections?: { title: string; rows: { ic?: string; text: string; sub?: string; go?: string; href?: string }[] }[]
}
export type BoardData = {
  w: number; h: number; nodes: BNode[]
  /** 항상 보이는 줄기 선 (SVG path) */
  trunks: string[]
  /** 재료 -> 결과 연결. 고른 항목의 것만 그린다 */
  links: [string, string][]
  labels: { x: number; y: number; text: string; big?: boolean }[]
  frames: { x: number; y: number; w: number; h: number; tex?: string }[]
  details: Record<string, BDetail>
}

const NODE = 48
const MIN = 0.25, MAX = 2

/**
 * 도전 과제 화면처럼 끌고 확대해서 보는 판.
 * 휠과 두 손가락으로 확대, 끌어서 이동, 항목을 누르면 설명이 옆(넓은 화면)이나 아래(좁은 화면)에 열린다.
 * 고른 항목은 주소의 ?item= 에 남는다.
 */
export default function Board({ data, param = 'item', placeholder = '이름으로 찾기', compact }: { data: BoardData; param?: string; placeholder?: string; compact?: boolean }) {
  const view = useRef<HTMLDivElement>(null)
  const layer = useRef<HTMLDivElement>(null)
  const t = useRef({ x: 0, y: 0, k: 1 })
  const [sel, setSel, ready] = useShallowParam(param)
  const [q, setQ] = useState('')
  const byId = useMemo(() => new Map(data.nodes.map((n) => [n.id, n])), [data])

  const apply = useCallback((smooth = false) => {
    const el = layer.current, v = view.current
    if (!el || !v) return
    const { x, y, k } = t.current
    el.style.transition = smooth ? 'transform 0.28s ease-out' : 'none'
    el.style.transform = `translate(${x}px,${y}px) scale(${k})`
    v.style.backgroundPosition = `${x}px ${y}px`
    v.style.backgroundSize = `${64 * k}px ${64 * k}px`
  }, [])

  const zoomAt = useCallback((cx: number, cy: number, k: number, smooth = false) => {
    const c = t.current
    const nk = Math.min(MAX, Math.max(MIN, k))
    c.x = cx - ((cx - c.x) / c.k) * nk
    c.y = cy - ((cy - c.y) / c.k) * nk
    c.k = nk
    apply(smooth)
  }, [apply])

  const fit = useCallback((smooth = true) => {
    const v = view.current
    if (!v) return
    const k = Math.min(MAX, Math.max(MIN, Math.min(v.clientWidth / data.w, v.clientHeight / data.h)))
    // 너무 작아지면 읽을 수 없으니 높이에 맞추고 왼쪽부터 보여 준다
    const use = Math.max(k, Math.min(1, v.clientHeight / data.h), 0.45)
    t.current = { k: use, x: use === k ? (v.clientWidth - data.w * use) / 2 : 8, y: Math.max(52, (v.clientHeight - data.h * use) / 2) }
    apply(smooth)
  }, [apply, data.w, data.h])

  const focus = useCallback((id: string) => {
    const n = byId.get(id), v = view.current
    if (!n || !v) return
    const k = Math.max(t.current.k, v.clientWidth >= 720 ? 0.9 : 0.75)
    // 넓은 화면에서는 오른쪽 설명 칸, 좁은 화면에서는 아래 설명 칸을 피해 가운데를 잡는다
    const wide = v.clientWidth >= 720
    const cx = wide ? (v.clientWidth - 340) / 2 : v.clientWidth / 2
    const cy = wide ? v.clientHeight / 2 : v.clientHeight * 0.3
    t.current = { k, x: cx - (n.x + NODE / 2) * k, y: cy - (n.y + NODE / 2) * k }
    apply(true)
  }, [apply, byId])

  // 처음 배치
  const placed = useRef(false)
  useEffect(() => {
    if (!ready || placed.current) return
    placed.current = true
    if (sel && byId.has(sel)) focus(sel)
    else fit(false)
  }, [ready, sel, byId, focus, fit])

  // 끌기, 두 손가락 확대, 휠 확대
  useEffect(() => {
    const v = view.current
    if (!v) return
    const pts = new Map<number, { x: number; y: number }>()
    let moved = 0, pinch = 0
    const rect = () => v.getBoundingClientRect()
    const down = (e: PointerEvent) => {
      if ((e.target as Element).closest('[data-ui]')) return
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pts.size === 1) moved = 0
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y) }
    }
    const move = (e: PointerEvent) => {
      const p = pts.get(e.pointerId)
      if (!p) return
      const dx = e.clientX - p.x, dy = e.clientY - p.y
      p.x = e.clientX; p.y = e.clientY
      if (pts.size === 1) {
        moved += Math.abs(dx) + Math.abs(dy)
        if (moved > 6) {
          if (!v.hasPointerCapture(e.pointerId)) v.setPointerCapture(e.pointerId)
          t.current.x += dx; t.current.y += dy
          apply()
        }
      } else if (pts.size === 2) {
        const [a, b] = [...pts.values()]
        const dist = Math.hypot(a.x - b.x, a.y - b.y)
        const r = rect()
        if (pinch > 0) zoomAt((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, t.current.k * (dist / pinch))
        pinch = dist
        moved = 99
      }
    }
    const up = (e: PointerEvent) => { pts.delete(e.pointerId); if (pts.size < 2) pinch = 0 }
    // 끌고 난 뒤 손을 뗄 때 항목이 눌리지 않게 한다
    const click = (e: MouseEvent) => { if (moved > 6) { e.preventDefault(); e.stopPropagation() } }
    const wheel = (e: WheelEvent) => {
      if ((e.target as Element).closest('[data-ui]')) return
      e.preventDefault()
      const r = rect()
      zoomAt(e.clientX - r.left, e.clientY - r.top, t.current.k * Math.exp(-e.deltaY * 0.0015))
    }
    v.addEventListener('pointerdown', down)
    v.addEventListener('pointermove', move)
    v.addEventListener('pointerup', up)
    v.addEventListener('pointercancel', up)
    v.addEventListener('click', click, true)
    v.addEventListener('wheel', wheel, { passive: false })
    return () => {
      v.removeEventListener('pointerdown', down)
      v.removeEventListener('pointermove', move)
      v.removeEventListener('pointerup', up)
      v.removeEventListener('pointercancel', up)
      v.removeEventListener('click', click, true)
      v.removeEventListener('wheel', wheel)
    }
  }, [apply, zoomAt])

  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setSel('') }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [setSel])

  const step = (f: number) => { const v = view.current!; zoomAt(v.clientWidth / 2, v.clientHeight / 2, t.current.k * f, true) }
  const pick = (id: string) => { setSel(id); focus(id) }

  const node = sel ? byId.get(sel) : undefined
  const detail = sel ? data.details[sel] : undefined
  // 고른 항목과 이어진 재료, 결과
  const related = useMemo(() => {
    const m = new Map<string, 'in' | 'out'>()
    if (!sel) return m
    for (const [a, b] of data.links) {
      if (b === sel) m.set(a, 'in')
      if (a === sel) m.set(b, 'out')
    }
    return m
  }, [sel, data.links])
  const paths = useMemo(() => {
    if (!node) return []
    const out: string[] = []
    for (const [id] of related) {
      const o = byId.get(id)
      if (!o) continue
      const [a, b] = related.get(id) === 'in' ? [o, node] : [node, o]
      const ax = a.x + NODE / 2, ay = a.y + NODE / 2, bx = b.x + NODE / 2, by = b.y + NODE / 2
      out.push(`M${ax} ${ay}V${(ay + by) / 2}H${bx}V${by}`)
    }
    return out
  }, [node, related, byId])

  // 설명 칸: 닫히는 동안에는 마지막으로 보던 항목을 그대로 그린다
  const sheet = usePresence(!!(node && detail))
  const keptNode = useRef(node), keptDetail = useRef(detail)
  if (node && detail) { keptNode.current = node; keptDetail.current = detail }
  const sNode = keptNode.current, sDetail = keptDetail.current

  const hits = useMemo(() => {
    const k = q.trim()
    if (!k) return null
    return new Set(data.nodes.filter((n) => score(n.name, k) > 0).map((n) => n.id))
  }, [q, data.nodes])
  const firstHit = hits && data.nodes.find((n) => hits.has(n.id))

  return (
    <div className={s.wrap}>
      <div className={cx(s.view, compact && s.viewCompact)} ref={view} data-dim={!!sel || !!hits}>
        <div className={s.layer} ref={layer} style={{ width: data.w, height: data.h }}>
          {data.frames.map((f, i) => (
            <div key={i} className={s.frame} style={{ left: f.x, top: f.y, width: f.w, height: f.h }} />
          ))}
          <svg className={s.lines} width={data.w} height={data.h} aria-hidden="true">
            {data.trunks.map((p, i) => <path key={i} d={p} className={s.trunk} />)}
            {paths.map((p, i) => <path key={'s' + i} d={p} className={s.linkOut} />)}
            {paths.map((p, i) => <path key={'l' + i} d={p} className={s.link} />)}
          </svg>
          {data.labels.map((l, i) => (
            <span key={i} className={cx(s.label, l.big && s.labelBig)} style={{ left: l.x, top: l.y }}>{l.text}</span>
          ))}
          {data.nodes.map((n) => {
            const rel = related.get(n.id)
            const on = n.id === sel || !!rel || (hits?.has(n.id) ?? false)
            return (
              <button
                key={n.id}
                type="button"
                className={s.node}
                style={{ left: n.x, top: n.y }}
                data-on={on}
                data-sel={n.id === sel}
                data-rel={rel}
                data-tone={n.tone}
                data-hot
                title={n.name}
                aria-label={n.name}
                onClick={() => pick(n.id)}
              >
                <svg className="ic" data-ic={n.ic} width={32} height={32} viewBox="0 0 16 16" aria-hidden="true"><use href={`${BASE}/gen/icons.svg#${n.ic}`} /></svg>
                {n.label && <span className={s.nodeLabel}>{n.name}</span>}
              </button>
            )
          })}
        </div>

        <div className={s.tools} data-ui>
          <label className={cx(ui.field, s.find)}>
            <Icon shape="search" />
            <input
              type="search" value={q} placeholder={placeholder} aria-label="판에서 찾기" autoComplete="off"
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && firstHit) pick(firstHit.id) }}
            />
            <span className={s.hits}>{hits ? hits.size : ''}</span>
          </label>
        </div>
        {/* 확대 버튼: 넓은 화면은 위쪽, 좁은 화면은 오른손 엄지가 닿는 오른쪽 아래 */}
        <div className={s.zoom} data-ui>
          <button type="button" className={cx(ui.btn, ui.btnSm)} onClick={() => step(1.3)} aria-label="확대">+</button>
          <button type="button" className={cx(ui.btn, ui.btnSm)} onClick={() => step(1 / 1.3)} aria-label="축소">-</button>
          <button type="button" className={cx(ui.btn, ui.btnSm)} onClick={() => fit()}>전체</button>
        </div>
        <p className={s.hint} data-ui>끌어서 이동 / 휠, 두 손가락으로 확대</p>

        {sheet.mounted && sNode && sDetail && (
          <aside className={s.sheet} data-ui role="dialog" aria-label={sNode.name} data-shown={sheet.shown} onTransitionEnd={sheet.onTransitionEnd}>
            <div className={s.grip} />
            <header className={s.sheetHead}>
              <span className={ui.slot}><svg className="ic" width={32} height={32} viewBox="0 0 16 16" aria-hidden="true"><use href={`${BASE}/gen/icons.svg#${sNode.ic}`} /></svg></span>
              <div className={s.sheetTitle}>
                <h2 className={s.sheetName}>{sNode.name}</h2>
                <div className={cx('wrap', ui.gap4)}>{sDetail.chips?.map((c) => <span key={c} className={ui.chip}>{c}</span>)}</div>
              </div>
              <button type="button" className={s.x} onClick={() => setSel('')} aria-label="닫기" data-hot><Icon shape="close" /></button>
            </header>
            <div className={s.sheetBody}>
              {(sDetail.stats?.length || sDetail.desc?.length) ? (
                <div className={s.tip}>
                  {sDetail.stats?.map((x) => <span key={x} className="t-grass">{x}</span>)}
                  {sDetail.desc?.map((x, i) => <span key={i} className="t-dim" dangerouslySetInnerHTML={{ __html: x }} />)}
                </div>
              ) : null}
              {sDetail.sections?.map((sec) => (
                <section key={sec.title} className={ui.gap4}>
                  <h3 className={ui.sub}>{sec.title}</h3>
                  <ul className={s.rows}>
                    {sec.rows.map((r, i) => {
                      const inner = (
                        <>
                          {r.ic && <svg className="ic" width={16} height={16} viewBox="0 0 16 16" aria-hidden="true"><use href={`${BASE}/gen/icons.svg#${r.ic}`} /></svg>}
                          <span className={s.rowText} dangerouslySetInnerHTML={{ __html: r.text }} />
                          {r.sub && <span className="t-dim t-num">{r.sub}</span>}
                        </>
                      )
                      return (
                        <li key={i}>
                          {r.go && byId.has(r.go) ? <button type="button" className={cx(s.row, s.rowGo)} onClick={() => pick(r.go!)}>{inner}</button>
                            : r.href ? <Link href={r.href} className={cx(s.row, s.rowGo)}>{inner}</Link>
                            : <div className={s.row}>{inner}</div>}
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ))}
              {sDetail.href && <Link href={sDetail.href} className={cx(ui.btn, ui.btnGrass)} style={{ alignSelf: 'flex-start' }}>상세 페이지</Link>}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
