'use client'
import { useRef, useState, type PointerEvent } from 'react'
import { Icon } from '@/components/ui'
import f from './fishing.module.css'

type Splash = { id: number; x: number; y: number }
// 물방울이 튀는 방향 (가로, 세로)
const DROPS: [number, number][] = [[-22, -30], [-12, -42], [-4, -52], [6, -46], [14, -36], [24, -26], [-30, -16], [32, -14]]

/** 선착장 장면. 물을 누르면 그 자리에서 물이 튄다. */
export default function Pond() {
  const [splashes, setSplashes] = useState<Splash[]>([])
  const seq = useRef(0)

  const splash = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const s = { id: ++seq.current, x: e.clientX - r.left, y: e.clientY - r.top }
    setSplashes((list) => [...list.slice(-5), s])
    window.setTimeout(() => setSplashes((list) => list.filter((x) => x.id !== s.id)), 700)
  }

  return (
    <section className={f.pond} aria-hidden="true">
      <div className={f.water} onPointerDown={splash}>
        {splashes.map((s) => (
          <div key={s.id} className={f.splash} style={{ left: s.x, top: s.y }}>
            <div className={f.ring} />
            {DROPS.map(([dx, dy], i) => (
              <div key={i} className={f.drop} style={{ '--dx': `${dx}px`, '--dy': `${dy}px` } as React.CSSProperties} />
            ))}
          </div>
        ))}
        <div className={f.fishA} data-hot><Icon shape="fish" mat="cyan" size={32} /></div>
        <div className={f.fishB} data-hot><Icon shape="fish" mat="gold" size={32} /></div>
      </div>
      <div className={f.pier}>
        <div className={f.post} />
        <div className={f.post} />
        <div className={f.post} />
      </div>
      <div className={f.rig}>
        <div className={f.rod} data-hot><Icon shape="pole" size={64} /></div>
        <div className={f.line} />
      </div>
      <div className={f.bobber} />
    </section>
  )
}
