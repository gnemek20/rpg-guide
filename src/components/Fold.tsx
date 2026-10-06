'use client'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon, cx, ui } from './ui'
import s from './fold.module.css'

/**
 * 접는 칸.
 * - mode="narrow": 좁은 화면에서만 접히고(처음엔 접힘) 넓은 화면에서는 항상 펼쳐져 있다
 * - mode="all": 어느 화면에서나 접을 수 있다. 처음 상태는 defaultOpen
 * 내용은 찌그러뜨리지 않는다. 바깥 칸이 높이를 열어 주는 동안 안쪽 내용이 위에서 끌려 내려오고,
 * 닫을 때는 다시 위로 밀려 들어간다. 전부 transition 이라 도중에 다시 눌러도 그 자리에서 되돌아간다.
 */
export default function Fold({ head, children, className, mode = 'narrow', defaultOpen = false, group }: {
  head: ReactNode; children: ReactNode; className?: string; mode?: 'narrow' | 'all'; defaultOpen?: boolean
  /** 같은 이름의 칸들은 "모두 접기/펼치기"(FoldAll)에 함께 반응한다 */
  group?: string
}) {
  const [open, setOpen] = useState(mode === 'all' ? defaultOpen : false)
  const openRef = useRef(open)
  const body = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)

  const set = useCallback((next: boolean) => {
    const b = body.current, i = inner.current
    if (!b || !i || next === openRef.current) return
    // 지금 높이에서 출발해야 중간에 눌러도 튀지 않는다
    b.style.height = `${b.getBoundingClientRect().height}px`
    void b.offsetHeight
    b.style.height = next ? `${i.scrollHeight}px` : '0px'
    openRef.current = next
    setOpen(next)
  }, [])

  useEffect(() => {
    if (!group) return
    const all = (e: Event) => { const d = (e as CustomEvent).detail as { group: string; open: boolean }; if (d.group === group) set(d.open) }
    window.addEventListener('fold:all', all)
    return () => window.removeEventListener('fold:all', all)
  }, [group, set])

  // 다 열린 뒤에는 높이를 풀어 둔다. 안의 내용이 바뀌어도(필터, 안쪽 접는 칸) 잘리지 않게
  const done = (e: React.TransitionEvent) => {
    if (e.target === body.current && e.propertyName === 'height' && openRef.current) body.current!.style.height = 'auto'
  }

  return (
    <div className={cx(s.fold, mode === 'all' ? s.all : s.narrow, className)} data-open={open} data-group>
      <button type="button" className={s.head} aria-expanded={open} onClick={() => set(!openRef.current)} data-hot>
        <div className={s.headBody}>{head}</div>
        <Icon shape="arrow" className={s.chev} />
      </button>
      <div className={s.body} ref={body} onTransitionEnd={done}>
        <div className={s.inner} ref={inner}>{children}</div>
      </div>
    </div>
  )
}

/** 같은 group 의 접는 칸을 한꺼번에 접거나 편다. 글자가 바뀌어도 크기가 변하지 않게 폭을 고정한다. */
export function FoldAll({ group, defaultOpen = true }: { group: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const toggle = () => {
    const next = !open
    setOpen(next)
    window.dispatchEvent(new CustomEvent('fold:all', { detail: { group, open: next } }))
  }
  return (
    <button type="button" className={cx(ui.btn, ui.btnSm, s.allBtn)} onClick={toggle}>
      <span>{open ? '모두 접기' : '모두 펼치기'}</span>
    </button>
  )
}
