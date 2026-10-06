'use client'
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type TransitionEvent } from 'react'
import { Icon } from '@/components/ui'
import f from './fishing.module.css'

// 단계: 0 제자리, 1 솟음, 2 떨어지며 사라짐. 각 단계는 앞 단계의 transition 이 끝나면 넘어간다
type Splash = { id: number; x: number; y: number; phase: 0 | 1 | 2 }
const DROPS: [number, number][] = [[-22, -30], [-12, -42], [-4, -52], [6, -46], [14, -36], [24, -26], [-30, -16], [32, -14]]

/**
 * 한 방향으로 흘러가는 움직임. keyframes 대신 transition 을 걸고,
 * 끝났다는 신호(transitionend)를 받으면 처음 자리로 돌려 다시 건다.
 */
function travel(el: HTMLElement, prop: 'transform' | 'backgroundPosition', from: string, to: () => string, ms: number, startAt = 0) {
  const css = prop === 'transform' ? 'transform' : 'background-position'
  let last = 0
  const go = (ratio = 0) => {
    last = performance.now()
    el.style.transition = 'none'
    el.style[prop] = from
    void el.offsetWidth
    el.style.transition = `${css} ${ms * (1 - ratio)}ms linear`
    el.style[prop] = to()
  }
  const end = (e: Event) => {
    const te = e as unknown as TransitionEvent
    if (te.target !== el || !te.propertyName.startsWith(css)) return
    // background-position 은 x, y 가 따로 끝났다고 알려 오므로 한 번만 받는다
    if (performance.now() - last < 60) return
    go()
  }
  el.addEventListener('transitionend', end)
  go(startAt)
  return () => el.removeEventListener('transitionend', end)
}

/** 선착장 장면. 물을 누르면 그 자리에서 물이 튄다. */
export default function Pond() {
  const [splashes, setSplashes] = useState<Splash[]>([])
  const seq = useRef(0)
  const water = useRef<HTMLDivElement>(null)
  const fishA = useRef<HTMLDivElement>(null)
  const fishB = useRef<HTMLDivElement>(null)
  const [up, setUp] = useState(false)
  const [tug, setTug] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const w = water.current!
    const across = () => `translateX(${w.clientWidth + 80}px)`
    const stops = [
      // 끝 자리가 무늬(64px) 의 정수배라서 처음 자리와 똑같이 보인다. 다시 걸어도 이음매가 없다
      travel(w, 'backgroundPosition', '0px 0px', () => '6400px 3200px', 600000),
      travel(fishA.current!, 'transform', 'translateX(0px)', across, 14000),
      travel(fishB.current!, 'transform', 'translateX(0px)', across, 21000),
    ]
    // 찌는 올라갔다 내려갔다를 transitionend 로 주고받는다
    const a = requestAnimationFrame(() => setUp(true))
    // 낚싯대는 가끔 움찔한다. 되돌아오는 것도 transitionend 가 맡는다
    const t = window.setInterval(() => setTug(true), 3200)
    return () => { stops.forEach((s) => s()); cancelAnimationFrame(a); window.clearInterval(t) }
  }, [])

  const splash = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const s: Splash = { id: ++seq.current, x: e.clientX - r.left, y: e.clientY - r.top, phase: 0 }
    setSplashes((list) => [...list.slice(-5), s])
    requestAnimationFrame(() => requestAnimationFrame(() => setSplashes((list) => list.map((x) => (x.id === s.id ? { ...x, phase: 1 } : x)))))
  }
  const next = (id: number) => (e: TransitionEvent) => {
    if (e.propertyName !== 'transform') return
    setSplashes((list) => list.flatMap((x) => (x.id !== id ? [x] : x.phase === 1 ? [{ ...x, phase: 2 as const }] : [])))
  }

  return (
    <section className={f.pond} aria-hidden="true">
      <div className={f.water} ref={water} onPointerDown={splash}>
        {splashes.map((s) => (
          <div key={s.id} className={f.splash} style={{ left: s.x, top: s.y }} data-phase={s.phase}>
            <div className={f.ring} />
            {DROPS.map(([dx, dy], i) => (
              <div key={i} className={f.drop} style={{ '--dx': `${dx}px`, '--dy': `${dy}px` } as CSSProperties} onTransitionEnd={i === 0 ? next(s.id) : undefined} />
            ))}
          </div>
        ))}
        <div className={f.fishA} ref={fishA} data-hot><Icon shape="fish" mat="cyan" size={32} /></div>
        <div className={f.fishB} ref={fishB} data-hot><Icon shape="fish" mat="gold" size={32} /></div>
      </div>
      <div className={f.pier}>
        <div className={f.post} />
        <div className={f.post} />
        <div className={f.post} />
      </div>
      <div className={f.rig} data-tug={tug} onTransitionEnd={(e) => { if (e.target === e.currentTarget) setTug(false) }}>
        <div className={f.rod} data-hot><Icon shape="pole" size={64} /></div>
        <div className={f.line} />
      </div>
      <div className={f.bobber} data-up={up} onTransitionEnd={() => setUp((v) => !v)} />
    </section>
  )
}
