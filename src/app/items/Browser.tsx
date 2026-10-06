'use client'
import { useCallback, useEffect, useRef, useState, type ReactNode, type TransitionEvent } from 'react'
import { BASE, Icon, cx, ui } from '@/components/ui'
import m from './browser.module.css'

export type Group = { id: string; label: string; sub?: string; ic: string; count: number }
type View = { g: string; phase: 'in' | 'out' | 'pre'; dir: 'fwd' | 'back' }

const pushed = { current: false }
function setUrl(g: string, push: boolean) {
  const url = new URL(window.location.href)
  if (g) url.searchParams.set('g', g)
  else url.searchParams.delete('g')
  // Next 가 history.state 에 넣어 둔 값은 그대로 넘긴다
  History.prototype[push ? 'pushState' : 'replaceState'].call(window.history, window.history.state, '', url)
}

/**
 * 아이템 도감의 좁은 화면용 보기.
 * 처음에는 종류를 3열 네모 칸으로 보여 주고, 하나를 누르면 그 종류의 목록으로 넘어간다.
 * 넘어갈 때는 지금 화면이 옆으로 밀리며 사라지고(transition), 그것이 끝난 것을 신호로 다음 화면이 반대쪽에서 들어온다.
 * 넓은 화면에서는 전부 펼친 기존 배치 그대로다 (CSS 가 결정).
 */
export default function Browser({ groups, children }: { groups: Group[]; children: ReactNode }) {
  const [view, setView] = useState<View>({ g: '', phase: 'in', dir: 'fwd' })
  const [searching, setSearching] = useState(false)
  const target = useRef('')
  const root = useRef<HTMLDivElement>(null)
  const timer = useRef(0)

  // 보여 줄 종류만 남긴다. 검색 중에는 전부 보여 주고 필터가 걸러 낸다
  const show = useCallback((g: string, all: boolean) => {
    root.current?.querySelectorAll<HTMLElement>('[data-gid]').forEach((el) => {
      el.dataset.off = String(!all && el.dataset.gid !== g)
    })
  }, [])

  const swap = useCallback(() => {
    window.clearTimeout(timer.current)
    const g = target.current
    show(g, false)
    setView((v) => ({ ...v, g, phase: 'pre' }))
    // 바뀐 화면의 첫 줄이 상단 바 바로 아래에 오게 한다
    const el = root.current
    if (el) window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 56) })
    requestAnimationFrame(() => requestAnimationFrame(() => setView((v) => ({ ...v, phase: 'in' }))))
  }, [show])

  const go = useCallback((g: string, dir: View['dir']) => {
    target.current = g
    setView((v) => (v.g === g && v.phase === 'in' ? v : { ...v, phase: 'out', dir }))
    // transition 이 일어나지 않는 환경 대비
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(swap, 400)
  }, [swap])

  const onEnd = (e: TransitionEvent) => {
    if (e.propertyName === 'opacity' && view.phase === 'out' && (e.target as HTMLElement).dataset.pane) swap()
  }

  useEffect(() => {
    const read = () => {
      const g = new URLSearchParams(window.location.search).get('g') ?? ''
      const ok = groups.some((x) => x.id === g) ? g : ''
      if (ok !== target.current) go(ok, ok ? 'fwd' : 'back')
    }
    // 처음에는 효과 없이 바로 맞춘다
    const g0 = new URLSearchParams(window.location.search).get('g') ?? ''
    const first = groups.some((x) => x.id === g0) ? g0 : ''
    target.current = first
    show(first, false)
    setView({ g: first, phase: 'in', dir: 'fwd' })
    const onFilter = (e: Event) => {
      const d = (e as CustomEvent).detail as { scope: string; f: string }
      if (d.scope === '#items') setSearching(!!d.f.trim())
    }
    window.addEventListener('popstate', read)
    window.addEventListener('filter:apply', onFilter)
    return () => { window.removeEventListener('popstate', read); window.removeEventListener('filter:apply', onFilter); window.clearTimeout(timer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { show(view.g, searching) }, [searching, view.g, show])

  const open = (g: string) => { setUrl(g, true); pushed.current = true; go(g, 'fwd') }
  const back = () => {
    if (searching) { window.dispatchEvent(new CustomEvent('filter:clear', { detail: '#items' })); return }
    // 눌러서 들어온 경우에는 브라우저 기록도 한 칸 되돌린다 (기기의 뒤로 가기와 같은 동작)
    if (pushed.current) { pushed.current = false; window.history.back() }
    else { setUrl('', false); go('', 'back') }
  }

  const cur = groups.find((x) => x.id === view.g)
  const list = searching || !!view.g
  return (
    <div className={m.browser} ref={root} data-view={list ? 'list' : 'grid'} data-phase={view.phase} data-dir={view.dir} data-searching={searching} onTransitionEnd={onEnd}>
      <div className={cx(m.pane, m.grid)} data-pane="grid">
        <ul className={m.tiles}>
          {groups.map((g) => (
            <li key={g.id} className={m.tileWrap}>
              <button type="button" className={m.tile} onClick={() => open(g.id)}>
                <span className={m.tileIcon}>
                  <svg className="ic" width={32} height={32} viewBox="0 0 16 16" aria-hidden="true"><use href={`${BASE}/gen/icons.svg#${g.ic}`} /></svg>
                  <span className={m.tileCount}>{g.count}</span>
                </span>
                <span className={m.tileLabel}>{g.label}</span>
                <span className={cx('t-tiny t-faint', m.tileSub)}>{g.sub ?? ''}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className={cx(m.pane, m.list)} data-pane="list">
        <div className={m.bar}>
          <button type="button" className={cx(ui.btn, m.barBack)} onClick={back}>
            <Icon shape="arrow" className={m.flip} />
            <span>종류</span>
          </button>
          <span className={m.barLabel}>{searching ? '검색 결과' : cur ? `${cur.label}${cur.sub ? ` / ${cur.sub}` : ''}` : ''}</span>
          <span className="t-faint">{searching ? '' : cur ? `${cur.count}종` : ''}</span>
        </div>
        <div id="items" className={cx(ui.gap16, m.items)}>{children}</div>
      </div>
    </div>
  )
}
